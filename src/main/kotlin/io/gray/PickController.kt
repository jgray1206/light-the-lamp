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

    @Get("/user/{userId}")
    fun getPickByUser(@PathVariable userId: Long): Flux<Pick> {
        return userRepository.findById(userId).flatMapMany { pickRepository.findAllByUser(it) }
    }

    @Get("/group/{groupId}")
    fun getPicksByGroup(@PathVariable groupId: Long): Flux<Pick> {
        return groupRepository.findById(groupId).flatMapMany { group -> pickRepository.findAllByGroup(group) }
    }

    @Post
    fun create(@QueryValue userId: Long, @QueryValue groupId: Long, @QueryValue gameId: Long, @QueryValue pick: String): Mono<Pick> {
        return userRepository.findById(userId).zipWith(groupRepository.findById(groupId)).zipWith(gameRepository.findById(gameId)).flatMap { tuple ->
            val game = tuple.t2
            val group = tuple.t1.t2
            val user = tuple.t1.t1

            check (game.awayTeam?.id == group.team?.id || game.homeTeam?.id == group.team?.id) {
                "can't submit pick for game where you group's team isn't playing, you big silly head"
            }

            check (game.date?.isAfter(LocalDateTime.now()) == true) {
                "can't submit pick on game that has already started, you little silly billy"
            }

            pickRepository.findByGameAndUserAndGroup(game, user, group).switchIfEmpty(
                    pickRepository.save(Pick().also {
                        it.game = game
                        it.group = group
                        it.user = user
                        if (pick == "goalies") {
                            it.goalies = true
                        } else if (pick == "team") {
                            it.team = true
                        } else if (game.players?.firstOrNull { it.name == pick } != null) {
                            it.gamePlayer = game.players?.firstOrNull { it.name == pick }
                        } else {
                            error("not valid pick")
                        }
                    })
            )
        }
    }

}
