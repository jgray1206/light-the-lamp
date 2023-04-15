package io.gray.controllers

import io.gray.model.Pick
import io.gray.repos.GameRepository
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
        private val gameRepository: GameRepository
) {
    @Get
    fun getAll(): Flux<Pick> {
        return pickRepository.findAll()
    }

    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<Pick> { // (2)
        return pickRepository.findById(id)
    }

    @Get("/user")
    fun getPickByUser(principal: Principal): Flux<Pick> {
        return userRepository.findByEmail(principal.name).flatMapMany { pickRepository.findAllByUser(it) }
    }

    @Post("/user")
    fun createForUser(@QueryValue("gameId") gameId: String, @QueryValue("pick") pick: String, principal: Principal): Mono<Pick> {
        return userRepository.findByEmail(principal.name).zipWith(gameRepository.findById(gameId.toLong())).flatMap { tuple ->
            val user = tuple.t1
            val game = tuple.t2

            check( user.teams?.any { it.id == game.awayTeam?.id || it.id ==  game.homeTeam?.id } == true) {
                "can't submit a pick for a game where none of your preferred teams are playing, you big silly head"
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
                            pickEntity.theTeam = true
                        } else if (game.players?.firstOrNull { it.name == pick } != null) {
                            pickEntity.gamePlayer = game.players?.firstOrNull { it.name == pick }
                        } else {
                            error("not valid pick")
                        }
                    })
            )
        }.map { it.user?.password = null; it.user?.ipAddress = null; it }
    }

}
