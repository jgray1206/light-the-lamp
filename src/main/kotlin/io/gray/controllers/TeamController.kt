package io.gray.controllers

import io.gray.model.Team
import io.gray.repos.TeamRepository
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux

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
