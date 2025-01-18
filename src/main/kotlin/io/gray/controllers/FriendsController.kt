package io.gray.controllers

import io.gray.model.UserUser
import io.gray.repos.FriendRepository
import io.gray.repos.UserRepository
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.security.Principal

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/friends")
class FriendsController(
    private val userRepository: UserRepository,
    private val friendRepository: FriendRepository
) {

    @Delete("/{id}")
    fun deleteFriend(@PathVariable id: Long, principal: Principal): Flux<Long> {
        return userRepository.findByEmailIgnoreCase(principal.name).flatMapMany { user ->
            Flux.merge(
                friendRepository.findByToUserAndFromUser(user.id!!, id),
                friendRepository.findByToUserAndFromUser(id, user.id!!)
            )
        }.flatMap { friendRepository.delete(it) }
    }

    @Post("/{confirmationUuid}")
    fun addFriend(@PathVariable confirmationUuid: String, principal: Principal): Mono<UserUser> {
        return userRepository.findByEmailIgnoreCase(principal.name)
            .zipWith(userRepository.findOneByConfirmationUuidAndConfirmed(confirmationUuid, true))
            .flatMap { userTuple ->
                if (userTuple.t1.confirmationUuid == userTuple.t2.confirmationUuid) {
                    Mono.error { IllegalStateException("You can't add yourself as a friend you big ol' silly head!") }
                } else {
                    friendRepository.findOneByToUserAndFromUser(userTuple.t1.id!!, userTuple.t2.id!!).switchIfEmpty(
                        friendRepository.save(UserUser().also {
                            it.toUser = userTuple.t1.id
                            it.fromUser = userTuple.t2.id
                        })
                    ).then(
                        friendRepository.findOneByToUserAndFromUser(userTuple.t2.id!!, userTuple.t1.id!!).switchIfEmpty(
                            friendRepository.save(UserUser().also {
                                it.toUser = userTuple.t2.id
                                it.fromUser = userTuple.t1.id
                            })
                        )
                    )
                }
            }
    }

}
