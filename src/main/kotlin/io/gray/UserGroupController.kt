package io.gray

import io.gray.model.*
import io.gray.repos.GroupRepository
import io.gray.repos.UserGroupRepository
import io.gray.repos.UserRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/usergroup")
class UserGroupController(
        private val groupRepository: GroupRepository,
        private val userRepository: UserRepository,
        private val userGroupRepository: UserGroupRepository
) {
    @Get
    fun all(): Flux<UserGroup> { // (1)
        return userGroupRepository.findAll()
    }

    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<UserGroup> { // (2)
        return userGroupRepository.findById(id)
    }

    @Get("/group/{groupId}")
    fun getUserGroupsByGroup(@PathVariable groupId: Long): Flux<UserGroup> {
        return userGroupRepository.findAllByGroupId(groupId)
    }

    @Post
    fun create(@QueryValue userId: Long, @QueryValue groupId: Long): Mono<UserGroup> {
        return userRepository.findById(userId).zipWith(groupRepository.findById(groupId)).flatMap { tuple ->
            userGroupRepository.findByUserIdAndGroupId(userId, groupId).switchIfEmpty(
                    userGroupRepository.save(UserGroup().also {
                        it.userId = tuple.t1.id
                        it.groupId = tuple.t2.id
                    })
            )
        }
    }

    @Delete
    fun delete(@QueryValue userId: Long, @QueryValue groupId: Long): Mono<Long> {
        return userGroupRepository.findByUserIdAndGroupId(userId, groupId).flatMap {
            userGroupRepository.delete(it)
        }
    }
}
