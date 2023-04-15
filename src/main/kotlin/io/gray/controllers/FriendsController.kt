package io.gray.controllers

import io.gray.model.*
import io.gray.repos.FriendRepository
import io.gray.repos.UserRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Mono
import java.security.Principal

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/friends")
class FriendsController(
        private val userRepository: UserRepository,
        private val friendRepository: FriendRepository
) {

    @Delete("/{id}")
    fun deleteFriend(@PathVariable id: Long, principal: Principal): Mono<Long> {
        return userRepository.findByEmail(principal.name).flatMap { user ->
            friendRepository.findOneByToUserAndFromUser(user.id!!, id).switchIfEmpty(
                    friendRepository.findOneByToUserAndFromUser(id, user.id!!)
            )
        }.flatMap { friendRepository.delete(it) }
    }

    @Post("/{confirmationUuid}")
    fun addFriend(@PathVariable confirmationUuid: String, principal: Principal): Mono<UserUser> {
        return userRepository.findByEmail(principal.name).zipWith(userRepository.findOneByConfirmationUuidAndConfirmed(confirmationUuid, true)).flatMap { userTuple ->
            friendRepository.findOneByToUserAndFromUser(userTuple.t1.id!!, userTuple.t2.id!!).switchIfEmpty(
                    friendRepository.findOneByToUserAndFromUser(userTuple.t2.id!!, userTuple.t1.id!!)
            )
        }
    }

}
