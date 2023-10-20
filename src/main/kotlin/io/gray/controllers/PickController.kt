package io.gray.controllers

import io.gray.model.Pick
import io.gray.model.Team
import io.gray.repos.AnnouncerRepository
import io.gray.repos.GameRepository
import io.gray.repos.PickRepository
import io.gray.repos.UserRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule
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
        private val announcerRepository: AnnouncerRepository
) {
    @Get
    fun getAll(principal: Principal, @QueryValue season: String): Flux<Pick> {
        return userRepository.findByEmail(principal.name).flatMapIterable {
            it.teams
        }.flatMap {
            pickRepository.findAllByTeamAndGameIdBetween(it, "${season}0000".toInt(), "${season}9999".toInt()).map { pick ->
                if (principal.name != pick.user?.email) {
                    pick.user?.email = null
                }
                pick.user?.password = null
                pick.user?.ipAddress = null
                pick.user?.confirmationUuid = null
                pick.user?.profilePic = byteArrayOf()
                pick.user?.attempts = null
                pick.user?.locked = null
                pick.user?.confirmed = null
                pick
            }
        }
    }

    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<Pick> {
        return pickRepository.findById(id)
    }

    @Get("/user")
    fun getPickByUser(principal: Principal, @QueryValue season: String): Flux<Pick> {
        return userRepository.findByEmail(principal.name).flatMapMany {
            pickRepository.findAllByUserAndGameIdBetween(it, "${season}0000".toInt(), "${season}9999".toInt())
        }
    }

    @Get("/announcer")
    fun getPickByAnnouncer(@QueryValue season: String): Flux<Pick> {
        return announcerRepository.findAll().flatMap {
            pickRepository.findAllByAnnouncerAndGameIdBetween(it, "${season}0000".toInt(), "${season}9999".toInt())
        }
    }

    @Get("/friends")
    fun getPicksByUserFriends(principal: Principal, @QueryValue season: String): Flux<Pick> {
        return userRepository.findByEmail(principal.name)
                .flatMapIterable { it.friends }
                .flatMap { pickRepository.findAllByUserAndGameIdBetween(it, "${season}0000".toInt(), "${season}9999".toInt()) }
                .mergeWith(
                        announcerRepository.findAll().flatMap {
                            pickRepository.findAllByAnnouncerAndGameIdBetween(it, "${season}0000".toInt(), "${season}9999".toInt())
                        }
                )
    }

    @Get("/friends-and-self")
    fun getPicksByUserFriendsAndUser(principal: Principal, @QueryValue season: String): Flux<Pick> {
        return userRepository.findByEmail(principal.name).filter { it.friends != null && it.teams != null }.flatMapMany {
            pickRepository.findAllByTeamInAndUserInAndGameIdBetween(it.teams!!, it.friends!!.plus(it), "${season}0000".toInt(), "${season}9999".toInt()).map { pick ->
                pick.user?.password = null
                if (principal.name != pick.user?.email) {
                    pick.user?.email = null
                }
                pick.user?.ipAddress = null
                pick.user?.confirmationUuid = null
                pick.user?.profilePic = byteArrayOf()
                pick.user?.attempts = null
                pick.user?.locked = null
                pick.user?.confirmed = null
                pick
            }
        }
    }

    @Get("/reddit")
    fun getPicksByReddit(principal: Principal, @QueryValue season: String): Flux<Pick> {
        return userRepository.findByEmail(principal.name).filter { it.teams != null }.flatMapMany {
            pickRepository.findAllByTeamInAndGameIdBetweenAndUserRedditUsernameIsNotEmpty(it.teams!!, "${season}0000".toInt(), "${season}9999".toInt()).map { pick ->
                pick.user?.password = null
                if (principal.name != pick.user?.email) {
                    pick.user?.email = null
                }
                pick.user?.ipAddress = null
                pick.user?.confirmationUuid = null
                pick.user?.profilePic = byteArrayOf()
                pick.user?.attempts = null
                pick.user?.locked = null
                pick.user?.confirmed = null
                pick
            }
        }
    }

    @Post("/user")
    fun createForUser(@QueryValue("gameId") gameId: String, @QueryValue("pick") pick: String, @QueryValue("teamId") teamId: Long, principal: Principal): Mono<Pick> {
        return userRepository.findByEmail(principal.name).zipWith(gameRepository.findById(gameId.toLong())).flatMap { tuple ->
            val user = tuple.t1
            val game = tuple.t2
            val team = Team().apply { this.id = teamId }

            check(user.teams?.any { it.id == game.awayTeam?.id || it.id == game.homeTeam?.id } == true) {
                "can't submit a pick for a game where none of your preferred teams are playing, you big silly head"
            }

            check(game.date?.isAfter(LocalDateTime.now()) == true) {
                "can't submit pick on game that has already started, you little silly billy"
            }

            pickRepository.findByGameAndUserAndTeam(game, user, team).switchIfEmpty(
                    pickRepository.save(Pick().also { pickEntity ->
                        pickEntity.game = game
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
            )
        }.map {
            it.user?.password = null
            if (principal.name != it.user?.email) {
                it.user?.email = null
            }
            it.user?.ipAddress = null
            it.user?.confirmationUuid = null
            it.user?.profilePic = byteArrayOf()
            it.user?.attempts = null
            it.user?.locked = null
            it.user?.confirmed = null
            it
        }
    }

    @Delete("/announcer")
    fun deleteForAnnouncer(@QueryValue("gameId") gameId: Long, @QueryValue("announcerId") announcerId: Long, authentication: Authentication): Mono<Long> {
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
    fun createForAnnouncer(@QueryValue("gameId") gameId: String, @QueryValue("pick") pick: String, @QueryValue("announcerId") announcerId: Long, authentication: Authentication): Mono<Pick> {
        if (!authentication.roles.contains("admin")) {
            error("can't submit picks for announcers if you aren't an admin you lil' hacker!")
        }
        return announcerRepository.findById(announcerId).zipWith(gameRepository.findById(gameId.toLong())).flatMap { tuple ->
            val announcer = tuple.t1
            val game = tuple.t2
            val team = tuple.t1.team!!

            pickRepository.findByGameAndAnnouncer(game, announcer)
                    .flatMap {
                        pickRepository.update(it.also {
                            it.goalies = false
                            it.theTeam = false
                            it.gamePlayer = null
                            if (pick == "goalies") {
                                it.goalies = true
                            } else if (pick == "team") {
                                it.theTeam = true
                            } else if (game.players?.firstOrNull { it.name == pick } != null) {
                                it.gamePlayer = game.players?.firstOrNull { it.name == pick }
                            }
                        })
                    }
                    .switchIfEmpty(
                            pickRepository.save(Pick().also { pickEntity ->
                                pickEntity.game = game
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
                    )
        }
    }

}
