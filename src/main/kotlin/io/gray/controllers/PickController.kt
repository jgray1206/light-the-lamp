package io.gray.controllers

import io.gray.model.Pick
import io.gray.model.Team
import io.gray.model.UserDTO
import io.gray.repos.AnnouncerRepository
import io.gray.repos.GameRepository
import io.gray.repos.PickRepository
import io.gray.repos.UserRepository
import io.micronaut.context.env.Environment
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.security.Principal
import java.time.LocalDateTime

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/pick")
class PickController(
    private val pickRepository: PickRepository,
    private val userRepository: UserRepository,
    private val gameRepository: GameRepository,
    private val announcerRepository: AnnouncerRepository,
    private val environment: Environment
) {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    @Get
    fun getAll(principal: Principal, @QueryValue season: String): Flux<Pick> {
        return userRepository.findByEmailIgnoreCase(principal.name).flatMapIterable {
            it.teams
        }.flatMap {
            pickRepository.findAllByTeamAndSeason(it, season)
                .filter { it.user?.parent == null }
        }
    }

    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<Pick> {
        return pickRepository.findById(id)
    }

    @Get("/user")
    fun getPickByUser(principal: Principal, @QueryValue season: String, @QueryValue pickingAs: Long?): Flux<Pick> {
        return userRepository.findByEmailIgnoreCase(principal.name)
            .mapNotNull { user ->
                return@mapNotNull if (pickingAs != null) {
                    user.kids?.firstOrNull { kid -> kid.id == pickingAs }
                } else {
                    user
                }
            }
            .flatMapMany {
                pickRepository.findAllByUserAndSeason(UserDTO().apply {
                    this.id = it!!.id
                    this.displayName = it.displayName
                }, season)
            }
    }

    @Get("/announcer")
    fun getPickByAnnouncer(@QueryValue season: String): Flux<Pick> {
        return announcerRepository.findAll().flatMap {
            pickRepository.findAllByAnnouncerAndSeason(it, season)
        }
    }

    @Get("/friends")
    fun getPicksByUserFriends(
        principal: Principal,
        @QueryValue season: String,
        @QueryValue pickingAs: Long?
    ): Flux<Pick> {
        val userStream = userRepository.findByEmailIgnoreCase(principal.name).mapNotNull { user ->
            return@mapNotNull if (pickingAs != null) {
                user.kids?.firstOrNull { kid -> kid.id == pickingAs }
                    ?.apply {
                        this.teams = user.teams
                        //add parent as kid's friend
                        this.friends = user.friends.orEmpty().plus(user.apply {
                            kids = null
                            friends = null
                            teams = null
                        })
                    }
            } else {
                user
            }
        }.flatMapIterable { it!!.friends.orEmpty().plus(it.kids.orEmpty()).plus(it.friends?.flatMap { fre -> fre.kids.orEmpty() }.orEmpty()) }
        return userStream.flatMap {
            pickRepository.findAllByUserAndSeason(UserDTO().apply {
                this.id = it.id
            }, season)
        }
            .mergeWith(
                announcerRepository.findAll().flatMap {
                    pickRepository.findAllByAnnouncerAndSeason(it, season)
                }
            )
    }

    @Get("/friends-and-self")
    fun getPicksByUserFriendsAndUser(principal: Principal, @QueryValue season: String): Flux<Pick> {
        return userRepository.findByEmailIgnoreCase(principal.name).filter { (it.friends != null || it.kids != null) && it.teams != null }
            .flatMapMany {
                pickRepository.findAllByTeamInAndUserInAndSeason(it.teams!!, it.friends.orEmpty().plus(it).plus(it.kids.orEmpty()).plus(it.friends?.flatMap { fre -> fre.kids.orEmpty() }.orEmpty()).map {
                    UserDTO().apply {
                        this.id = it.id
                        this.displayName = it.displayName
                    }
                }, season)
            }
    }

    @Get("/reddit")
    fun getPicksByReddit(principal: Principal, @QueryValue season: String): Flux<Pick> {
        return userRepository.findByEmailIgnoreCase(principal.name).filter { it.teams != null }.flatMapMany {
            pickRepository.findAllByTeamInAndSeasonAndUserRedditUsernameIsNotEmpty(it.teams!!, season)
        }
    }

    @Post("/user")
    fun createForUser(
        @QueryValue("gameId") gameId: String,
        @QueryValue("pick") pick: String,
        @QueryValue("teamId") teamId: Long,
        @QueryValue("pickingAs") pickingAs: Long?,
        principal: Principal
    ): Mono<Pick> {
        if (pickingAs != null) {
            return userRepository.findByEmailIgnoreCase(principal.name)
                .zipWith(gameRepository.findById(gameId.toLong()))
                .flatMap { tuple ->
                    val game = tuple.t2
                    val team = Team().apply { this.id = teamId }
                    val kid = tuple.t1.kids?.firstOrNull { it.id == pickingAs }

                    check(kid != null) {
                        "can't submit a pick for a kid that ain't yours ya silly goof"
                    }

                    val kidDTO = UserDTO().apply {
                        this.id = kid.id
                        this.displayName = kid.displayName
                    }

                    check(tuple.t1.teams?.any { it.id == game.awayTeam?.id || it.id == game.homeTeam?.id } == true) {
                        "can't submit a pick for a game where none of your preferred teams are playing, you big silly head"
                    }

                    check(game.awayTeam?.id == teamId || game.homeTeam?.id == teamId) {
                        "can't submit pick for a team in a game they aren't playing in, you goofy goober"
                    }
                    pickRepository.findByGameAndUserAndTeam(game, kidDTO, team).switchIfEmpty(
                        Mono.defer {
                            pickRepository.save(Pick().also { pickEntity ->
                                logger.info("creating pick $pick for gameId $gameId and teamId $teamId for user id ${tuple.t1.id}'s kid ${kid.id}")
                                pickEntity.game = game
                                pickEntity.season = game.season
                                pickEntity.team = team
                                pickEntity.user = kidDTO
                                if (pick == "goalies") {
                                    pickEntity.goalies = true
                                } else if (pick == "team") {
                                    pickEntity.theTeam = true
                                } else if (game.players?.firstOrNull { it.name == pick } != null) {
                                    pickEntity.gamePlayer = game.players?.firstOrNull { it.name == pick }
                                } else {
                                    error("not a valid pick")
                                }
                            })
                        }
                    )
                }
        }
        return userRepository.findByEmailIgnoreCase(principal.name).zipWith(gameRepository.findById(gameId.toLong()))
            .flatMap { tuple ->
                val user = UserDTO().apply {
                    this.id = tuple.t1.id
                    this.displayName = tuple.t1.displayName
                    this.redditUsername = tuple.t1.redditUsername
                }
                val game = tuple.t2
                val team = Team().apply { this.id = teamId }

                check(tuple.t1.teams?.any { it.id == game.awayTeam?.id || it.id == game.homeTeam?.id } == true) {
                    "can't submit a pick for a game where none of your preferred teams are playing, you big silly head"
                }

                check(game.awayTeam?.id == teamId || game.homeTeam?.id == teamId) {
                    "can't submit pick for a team in a game they aren't playing in, you goofy goober"
                }

                check(
                    game.date?.plusMinutes(6)?.isAfter(LocalDateTime.now()) == true || environment.activeNames.contains(
                        "local"
                    )
                ) {
                    "can't submit pick on game that has already started, you little silly billy"
                }
                gameRepository.findTop2ByDateLessThanAndSeasonAndHomeTeamOrAwayTeamOrderByIdDesc(
                    game.date!!,
                    game.season!!,
                    team,
                    team
                )
                    .flatMap { pickRepository.findByGameAndUserAndTeam(it, user, team) }
                    .collectList()
                    .doOnNext {
                        when (pick) {
                            "goalies" -> {
                                check(it.none { prevPick -> prevPick.goalies == true }) {
                                    "can't pick the goalies since you just picked them, you little hacker boy"
                                }
                            }

                            "team" -> {
                                check(it.none { prevPick -> prevPick.theTeam == true }) {
                                    "can't pick the team since you just picked it, you little hacker boy"
                                }
                            }

                            else -> {
                                check(it.none { prevPick -> prevPick.gamePlayer?.name == pick }) {
                                    "can't pick $pick since you just picked them, you little hacker boy"
                                }
                            }
                        }
                    }.then(
                        pickRepository.findByGameAndUserAndTeam(game, user, team).switchIfEmpty(
                            Mono.defer {
                                pickRepository.save(Pick().also { pickEntity ->
                                    logger.info("creating pick $pick for gameId $gameId and teamId $teamId for user id ${tuple.t1.id}")
                                    pickEntity.game = game
                                    pickEntity.season = game.season
                                    pickEntity.team = team
                                    pickEntity.user = user
                                    if (pick == "goalies") {
                                        pickEntity.goalies = true
                                    } else if (pick == "team") {
                                        pickEntity.theTeam = true
                                    } else if (game.players?.firstOrNull { it.name == pick } != null) {
                                        pickEntity.gamePlayer = game.players?.firstOrNull { it.name == pick }
                                    } else {
                                        error("not a valid pick")
                                    }
                                })
                            }
                        ))
            }
    }

    @Delete("/announcer")
    fun deleteForAnnouncer(
        @QueryValue("gameId") gameId: Long,
        @QueryValue("announcerId") announcerId: Long,
        authentication: Authentication
    ): Mono<Long> {
        if (!authentication.roles.contains("admin")) {
            error("can't delete picks for announcers if you aren't an admin you lil' hacker!")
        }
        return announcerRepository.findById(announcerId).zipWith(gameRepository.findById(gameId)).flatMap { tuple ->
            val announcer = tuple.t1
            val game = tuple.t2
            pickRepository.findByGameAndAnnouncer(game, announcer)
        }.flatMap {
            pickRepository.delete(it)
        }
    }

    @Post("/announcer")
    fun createForAnnouncer(
        @QueryValue("gameId") gameId: String,
        @QueryValue("pick") pick: String?,
        @QueryValue("announcerId") announcerId: Long,
        @QueryValue("doublePoints") doublePoints: Boolean?,
        authentication: Authentication
    ): Mono<Pick> {
        if (!authentication.roles.contains("admin")) {
            error("can't submit picks for announcers if you aren't an admin you lil' hacker!")
        }
        return announcerRepository.findById(announcerId).zipWith(gameRepository.findById(gameId.toLong()))
            .flatMap { tuple ->
                val announcer = tuple.t1
                val game = tuple.t2
                val team = tuple.t1.team!!

                pickRepository.findByGameAndAnnouncer(game, announcer)
                    .flatMap {
                        pickRepository.update(it.also {
                            if (pick != null) {
                                it.goalies = null
                                it.theTeam = null
                                it.gamePlayer = null
                                if (pick == "goalies") {
                                    it.goalies = true
                                } else if (pick == "team") {
                                    it.theTeam = true
                                } else if (game.players?.firstOrNull { it.name == pick } != null) {
                                    it.gamePlayer = game.players?.firstOrNull { it.name == pick }
                                }
                            }
                            if (doublePoints != null) {
                                it.doublePoints = doublePoints
                            }
                        })
                    }
                    .switchIfEmpty(Mono.defer {
                        pickRepository.save(Pick().also { pickEntity ->
                            pickEntity.game = game
                            pickEntity.season = game.season
                            pickEntity.announcer = announcer
                            pickEntity.team = team
                            if (pick == "goalies") {
                                pickEntity.goalies = true
                            } else if (pick == "team") {
                                pickEntity.theTeam = true
                            } else if (game.players?.firstOrNull { it.name == pick } != null) {
                                pickEntity.gamePlayer = game.players?.firstOrNull { it.name == pick }
                            } else {
                                error("not a valid pick")
                            }
                        })
                    })
            }
    }
}
