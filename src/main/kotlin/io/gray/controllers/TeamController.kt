package io.gray.controllers

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

@Secured(SecurityRule.IS_ANONYMOUS)
@Controller("/teams")
class TeamController(
        private val teamRepository: TeamRepository
) {
    @Get
    fun allTeams(): Flux<Team> {
        return teamRepository.findAll()
    }
}
