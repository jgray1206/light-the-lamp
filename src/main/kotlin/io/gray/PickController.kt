package io.gray

import io.gray.model.Pick
import io.gray.repos.GameRepository
import io.gray.repos.GroupRepository
import io.gray.repos.PickRepository
import io.gray.repos.UserRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
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
        private val groupRepository: GroupRepository,
        private val gameRepository: GameRepository
) {
    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<Pick> { // (2)
        return pickRepository.findById(id)
    }

    @Get("/user")
    fun getPickByUser(principal: Principal): Flux<Pick> {
        return userRepository.findByEmail(principal.name).flatMapMany { pickRepository.findAllByUser(it) }
    }

    @Get("/group")
    fun getPicksByGroup(principal: Principal): Flux<Pick> {
        return userRepository.findByEmail(principal.name).flatMapMany { user ->
            user.groups?.map { group ->
                pickRepository.findAllByGroup(group)
            }?.let { Flux.concat(it) }
        }
    }

    @Post("/group")
    fun createForGroup(@QueryValue groupId: Long, @QueryValue gameId: Long, @QueryValue pick: String, principal: Principal): Mono<Pick> {
        return userRepository.findByEmail(principal.name).zipWith(groupRepository.findById(groupId)).zipWith(gameRepository.findById(gameId)).flatMap { tuple ->
            val game = tuple.t2
            val group = tuple.t1.t2
            val user = tuple.t1.t1

            check(game.awayTeam?.id == group.team?.id || game.homeTeam?.id == group.team?.id) {
                "can't submit pick for game where your group's team isn't playing, you big silly head"
            }

            check(game.date?.isAfter(LocalDateTime.now()) == true) {
                "can't submit pick on game that has already started, you little silly billy"
            }

            pickRepository.findByGameAndUserAndGroup(game, user, group).switchIfEmpty(
                    pickRepository.save(Pick().also { pickEntity ->
                        pickEntity.game = game
                        pickEntity.group = group
                        pickEntity.user = user
                        if (pick == "goalies") {
                            pickEntity.goalies = true
                        } else if (pick == "team") {
                            pickEntity.team = true
                        } else if (game.players?.firstOrNull { it.name == pick } != null) {
                            pickEntity.gamePlayer = game.players?.firstOrNull { it.name == pick }
                        } else {
                            error("not valid pick")
                        }
                    })
            )
        }
    }

    @Post("/user")
    fun createForUser(@QueryValue("gameId") gameId: Long, @QueryValue("pick") pick: String, principal: Principal): Mono<Pick> {
        return userRepository.findByEmail(principal.name).zipWith(gameRepository.findById(gameId)).flatMap { tuple ->
            val user = tuple.t1
            val game = tuple.t2

            check(game.awayTeam?.id == user.team?.id || game.homeTeam?.id == user.team?.id) {
                "can't submit pick for game where your preferred team isn't playing, you big silly head"
            }

            check(game.date?.isAfter(LocalDateTime.now()) == true) {
                "can't submit pick on game that has already started, you little silly billy"
            }

            pickRepository.findByGameAndUser(game, user).switchIfEmpty(
                    pickRepository.save(Pick().also { pickEntity ->
                        pickEntity.game = game
                        pickEntity.user = user
                        if (pick == "goalies") {
                            pickEntity.goalies = true
                        } else if (pick == "team") {
                            pickEntity.team = true
                        } else if (game.players?.firstOrNull { it.name == pick } != null) {
                            pickEntity.gamePlayer = game.players?.firstOrNull { it.name == pick }
                        } else {
                            error("not valid pick")
                        }
                    })
            )
        }
    }

}
