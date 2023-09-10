package io.gray.controllers

import io.gray.model.*
import io.gray.repos.*
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.security.Principal

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/game")
class GameController(
        private val gameRepository: GameRepository,
        private val userRepository: UserRepository
) {
    @Get("/{id}")
    fun all(id: Long): Mono<Game> {
        return gameRepository.findById(id)
    }

    @Get("/team/{id}")
    fun gameByTeamId(id: Long): Flux<Game> {
        return gameRepository.findByHomeTeamOrAwayTeam(Team().also { it.id = id }, Team().also { it.id = id })
    }

    @Get("/user")
    fun getGamesByUser(principal: Principal, @QueryValue season: String, @QueryValue maxGames: Int): Flux<Game> {
        return userRepository.findByEmail(principal.name).flatMapIterable { user ->
            user.teams
        }.flatMap { team ->
            gameRepository.findByHomeTeamOrAwayTeamAndIdBetween(team,
                    team,
                    "${season}000000".toInt(),
                    "${season.toInt() + 1}000000".toInt(),
                    maxGames
            )
        }.distinct { it.id }
    }
}
