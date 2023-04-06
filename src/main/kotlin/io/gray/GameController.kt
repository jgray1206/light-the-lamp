package io.gray

import io.gray.model.*
import io.gray.repos.GamePlayerRepository
import io.gray.repos.GameRepository
import io.gray.repos.GroupRepository
import io.gray.repos.TeamRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/game")
class GameController(
        private val gameRepository: GameRepository,
        private val groupRepository: GroupRepository,
        private val teamRepository: TeamRepository
) {
    @Get("/{id}")
    fun all(id: Long): Mono<Game> {
        return gameRepository.findById(id)
    }

    @Get("/team/{id}")
    fun gameByTeamId(id: Long): Flux<Game> {
        return gameRepository.findByHomeTeamOrAwayTeam(Team().also {  it.id = id }, Team().also { it.id = id })
    }

    @Get("/group/{groupId}")
    fun getGamesByGroup(@PathVariable groupId: Long): Flux<Game> {
        return groupRepository.findById(groupId).flatMapMany { group ->
            val team = Team().also {  it.id = group.team?.id }
            gameRepository.findByHomeTeamOrAwayTeam(team, team).map { game ->
                game.players = game.players?.filter { player -> player.team?.id == team.id }
                game
            }
        }
    }

}
