package io.gray

import io.gray.model.Group
import io.gray.model.GroupRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Secured(SecurityRule.IS_ANONYMOUS)
@Controller("/group")
class GroupController(
        private val groupRepository: GroupRepository
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
    fun create(@Body group: Group): Mono<Group> {
        return groupRepository.save(group)
    }

    @Put
    fun update(@Body group: Group): Mono<Group> {
        return groupRepository.update(group)
    }
}
