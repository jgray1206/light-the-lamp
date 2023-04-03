package io.gray

import io.github.resilience4j.micronaut.annotation.RateLimiter
import io.gray.model.User
import io.gray.repos.UserRepository
import io.micronaut.http.annotation.*
import io.micronaut.http.server.util.DefaultHttpClientAddressResolver
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import org.mindrot.jbcrypt.BCrypt
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/user")
open class UserController(
        private val userRepository: UserRepository,
        private val httpClientAddressResolver: DefaultHttpClientAddressResolver
) {

    @Secured(SecurityRule.IS_ANONYMOUS)
    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<User> { // (2)
        return userRepository.findById(id).map { it.apply { it.password = null; } }
    }

    @Post
    @Secured(SecurityRule.IS_ANONYMOUS)
    @RateLimiter(name = "usercreate")
    open fun create(@Body user: User, httpRequest: io.micronaut.http.HttpRequest<User>): Mono<User> {
        return userRepository.findByEmail(user.email!!).switchIfEmpty(
                kotlin.run {
                    check(user.password!!.length > 14) { "password length should be at least 14 characters you insecure bozo!!!! it's ${LocalDateTime.now().year}!!! get a password manager LOL!!!!" }
                    userRepository.save(user.also {
                        it.password = BCrypt.hashpw(it.password, BCrypt.gensalt(12))
                        it.ipAddress = httpClientAddressResolver.resolve(httpRequest)
                    })
                }
        ).map { it.apply { it.password = null; it.ipAddress = null; } }
    }

    @Put
    fun update(@Body user: User): Mono<User> {
        return userRepository.update(user)
    }

}
