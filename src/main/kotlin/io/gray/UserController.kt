package io.gray

import io.gray.model.Group
import io.gray.model.GroupRepository
import io.gray.model.User
import io.gray.model.UserRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Secured(SecurityRule.IS_ANONYMOUS)
@Controller("/user")
class UserController(
        private val userRepository: UserRepository
) {
    @Get
    fun all(): Flux<User> { // (1)
        return userRepository.findAll()
    }

    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<User> { // (2)
        return userRepository.findById(id)
    }

    @Post
    fun create(@Body user: User): Mono<User> {
        return userRepository.save(user)
    }

    @Put
    fun update(@Body user: User): Mono<User> {
        return userRepository.update(user)
    }
}
