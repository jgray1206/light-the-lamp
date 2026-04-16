package io.gray.controllers

import io.gray.model.Game
import io.gray.model.Pick
import io.gray.model.Team
import io.gray.model.UserDTO
import io.gray.repos.AnnouncerRepository
import io.gray.repos.GameRepository
import io.gray.repos.PickRepository
import io.gray.repos.UserRepository
import io.micronaut.context.env.Environment
import io.micronaut.data.exceptions.DataAccessException
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
        return userRepository.findByEmailIgnoreCase(principal.name)
                .zipWith(gameRepository.findById(gameId.toLong()))
                .flatMap { tuple ->
                    val currentUser = tuple.t1
                    val game = tuple.t2
                    val team = Team().apply { this.id = teamId }

                    val userDTO = if (pickingAs != null) {
                        val kid = currentUser.kids?.firstOrNull { it.id == pickingAs }
                        check(kid != null) { "can't submit a pick for a kid that ain't yours ya silly goof" }
                        UserDTO().apply {
                            this.id = kid.id
                            this.displayName = kid.displayName
                        }
                    } else {
                        check(
                                game.date?.plusMinutes(6)?.isAfter(LocalDateTime.now()) == true
                                        || environment.activeNames.contains("local")
                        ) { "can't submit pick on game that has already started, you little silly billy" }
                        UserDTO().apply {
                            this.id = currentUser.id
                            this.displayName = currentUser.displayName
                            this.redditUsername = currentUser.redditUsername
                        }
                    }

                    check(currentUser.teams?.any { it.id == game.awayTeam?.id || it.id == game.homeTeam?.id } == true) {
                        "can't submit a pick for a game where none of your preferred teams are playing, you big silly head"
                    }
                    check(game.awayTeam?.id == teamId || game.homeTeam?.id == teamId) {
                        "can't submit pick for a team in a game they aren't playing in, you goofy goober"
                    }

                    val recentPicksCheck = if (pickingAs == null) {
                        gameRepository.findTop2ByDateLessThanAndSeasonAndHomeTeamOrAwayTeamOrderByIdDesc(
                                game.date!!, game.season!!, team, team
                        )
                                .flatMap { pickRepository.findByGameAndUserAndTeam(it, userDTO, team) }
                                .collectList()
                                .doOnNext { recentPicks ->
                                    when (pick) {
                                        "goalies" -> check(recentPicks.none { it.goalies == true }) {
                                            "can't pick the goalies since you just picked them, you little hacker boy"
                                        }
                                        "team" -> check(recentPicks.none { it.theTeam == true }) {
                                            "can't pick the team since you just picked it, you little hacker boy"
                                        }
                                        else -> check(recentPicks.none { it.gamePlayer?.name == pick }) {
                                            "can't pick $pick since you just picked them, you little hacker boy"
                                        }
                                    }
                                }.then()
                    } else {
                        Mono.empty()
                    }

                    recentPicksCheck.then(
                            upsertPick(game, team, userDTO, pick)
                    )
                }
    }

    private fun upsertPick(game: Game, team: Team, userDTO: UserDTO, pick: String): Mono<Pick> {
        val newPick = Pick().also { pickEntity ->
            pickEntity.game = game
            pickEntity.season = game.season
            pickEntity.team = team
            pickEntity.user = userDTO
            when {
                pick == "goalies" -> pickEntity.goalies = true
                pick == "team" -> pickEntity.theTeam = true
                game.players?.firstOrNull { it.name == pick } != null ->
                    pickEntity.gamePlayer = game.players?.firstOrNull { it.name == pick }
                else -> error("not a valid pick")
            }
        }

        logger.info("saving pick $pick for gameId ${game.id} and teamId ${team.id} for user ${userDTO.id}")

        return pickRepository.save(newPick)
                .onErrorResume(DataAccessException::class.java) { ex ->
                    // Only swallow unique constraint violations (Postgres error code 23505)
                    if (ex.cause?.message?.contains("23505") == true) {
                        logger.info("duplicate pick detected for gameId ${game.id}, teamId ${team.id}, userId ${userDTO.id} — returning existing")
                        pickRepository.findByGameAndUserAndTeam(game, userDTO, team)
                    } else {
                        Mono.error(ex) // re-throw anything else
                    }
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
