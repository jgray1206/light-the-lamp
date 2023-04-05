package io.gray

import io.gray.model.Group
import io.gray.repos.*
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.security.Principal
import java.util.*

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/group")
class GroupController(
        private val groupRepository: GroupRepository,
        private val teamRepository: TeamRepository
) {
    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<Group> {
        return groupRepository.findById(id)
    }

    @Post
    fun create(@QueryValue name: String, @QueryValue teamId: Long, principal: Principal): Mono<Group> {
        return teamRepository.findById(teamId).flatMap { team ->
             groupRepository.save(Group().also {
                 it.name = name
                 it.team = team
                 it.uuid = UUID.randomUUID().toString()
                 it.createUser = principal.name
             })
        }
    }

    @Delete
    fun delete(@Body group: Group): Mono<Long> {
        return groupRepository.delete(group)
    }
}
