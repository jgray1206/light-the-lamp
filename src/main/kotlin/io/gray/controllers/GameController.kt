package io.gray.controllers

import io.gray.GameStateSyncer
import io.gray.model.*
import io.gray.repos.*
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.security.Principal

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/game")
class GameController(
        private val gameRepository: GameRepository,
        private val userRepository: UserRepository,
        private val announcerRepository: AnnouncerRepository,
        private val gameStateSyncer: GameStateSyncer
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
        return userRepository.findByEmailIgnoreCase(principal.name).flatMapIterable { user ->
            user.teams
        }.flatMap { team ->
            gameRepository.findByHomeTeamOrAwayTeamAndIdBetween(team,
                    team,
                    "${season}0000".toInt(),
                    "${season}9999".toInt(),
                    maxGames
            )
        }.distinct { it.id }
    }

    @Get("/announcers")
    fun getGamesByAnnouncers(@QueryValue season: String, @QueryValue maxGames: Int): Flux<Game> {
        return announcerRepository.findAll().map { announcer ->
            announcer.team
        }.flatMap { team ->
            gameRepository.findByHomeTeamOrAwayTeamAndIdBetween(team!!,
                    team,
                    "${season}0000".toInt(),
                    "${season}9999".toInt(),
                    maxGames
            )
        }.distinct { it.id }
    }

    @Post("/refresh-points")
    fun refreshPoints(@QueryValue gameId: String, authentication: Authentication): Flux<Int> {
        if (!authentication.roles.contains("admin")) {
            error("can't refresh games if you aren't an admin you lil' hacker!")
        }
        return gameRepository.findById(gameId.toLong()).flatMapMany {
            gameStateSyncer.updatePoints(it)
        }
    }
}
