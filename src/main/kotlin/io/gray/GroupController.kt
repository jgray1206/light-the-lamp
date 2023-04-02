package io.gray

import io.gray.model.Group
import io.gray.repos.*
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Secured(SecurityRule.IS_ANONYMOUS)
@Controller("/group")
class GroupController(
        private val groupRepository: GroupRepository,
        private val teamRepository: TeamRepository,
        private val pickRepository: PickRepository,
        private val gameRepository: GameRepository
) {
    @Get
    fun all(): Flux<Group> { // (1)
        return groupRepository.findAll()
    }

    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<Group> { // (2)
        return groupRepository.findById(id)
    }

    @Post
    fun create(@QueryValue name: String, @QueryValue teamId: Long): Mono<Group> {
        return teamRepository.findById(teamId).flatMap { team ->
             groupRepository.save(Group().also {
                 it.name = name
                 it.team = team
                //todo add "created by user" for logged in user
             })
        }
    }

    @Put
    fun update(@Body group: Group): Mono<Group> {
        return groupRepository.update(group)
    }
}
