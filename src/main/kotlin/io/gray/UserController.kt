package io.gray

import io.github.resilience4j.micronaut.annotation.RateLimiter
import io.gray.email.MailService
import io.gray.model.User
import io.gray.repos.UserRepository
import io.micronaut.http.HttpRequest
import io.micronaut.http.annotation.*
import io.micronaut.http.server.util.DefaultHttpClientAddressResolver
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import org.mindrot.jbcrypt.BCrypt
import reactor.core.publisher.Mono
import java.util.UUID
import kotlin.Long
import kotlin.String
import kotlin.also
import kotlin.apply
import kotlin.check


@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/user")
open class UserController(
        private val userRepository: UserRepository,
        private val httpClientAddressResolver: DefaultHttpClientAddressResolver,
        private val mailService: MailService
) {

    @Secured(SecurityRule.IS_ANONYMOUS)
    @Get("/{id}")
    fun get(@PathVariable id: Long): Mono<User> { // (2)
        return userRepository.findById(id).map { it.apply { it.password = null; } }
    }

    @Post
    @Secured(SecurityRule.IS_ANONYMOUS)
    @RateLimiter(name = "usercreate")
    open fun create(@Body user: User, httpRequest: HttpRequest<User>): Mono<User> {
        return userRepository.findByEmail(user.email!!).switchIfEmpty(
                kotlin.run {
                    check(user.password!!.length > 10) { "password length should be at least 10 characters you insecure doofus!!!!" }
                    userRepository.save(user.also {
                        it.password = BCrypt.hashpw(it.password, BCrypt.gensalt(12))
                        it.ipAddress = httpClientAddressResolver.resolve(httpRequest)
                        it.confirmed = false
                        it.confirmationUuid = UUID.randomUUID().toString()
                    }).doOnSuccess {
                        mailService.sendEmail(it.email!!, "Confirm Light The Lamp Account", "Welcome to Light The Lamp! Click here to confirm your account: http://157.230.209.115/user/confirm/${it.confirmationUuid}")
                    }
                }
        ).map { it.apply { it.password = null; it.ipAddress = null; } }
    }

    @Put
    fun update(@Body user: User): Mono<User> {
        return userRepository.update(user)
    }

    @Get("/confirm/{uuid}")
    @Secured(SecurityRule.IS_ANONYMOUS)
    @RateLimiter(name = "usercreate")
    open fun confirm(@PathVariable uuid: String): Mono<User> {
        return userRepository.findOneByConfirmationUuidAndConfirmed(uuid, false).flatMap {
            userRepository.update(it.also { it.confirmed = true })
        }.map { it.apply { it.password = null; it.ipAddress = null; } }
    }

}
