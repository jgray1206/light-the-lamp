package io.gray.controllers

import io.github.resilience4j.micronaut.annotation.RateLimiter
import io.gray.model.UserRequest
import io.gray.email.MailService
import io.gray.model.Team
import io.gray.model.User
import io.gray.repos.UserRepository
import io.micronaut.http.HttpRequest
import io.micronaut.http.MediaType
import io.micronaut.http.annotation.*
import io.micronaut.http.server.util.DefaultHttpClientAddressResolver
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import org.mindrot.jbcrypt.BCrypt
import reactor.core.publisher.Mono
import java.lang.IllegalStateException
import java.security.Principal
import java.util.*
import javax.validation.Valid
import kotlin.String
import kotlin.also
import kotlin.apply


@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/user")
open class UserController(
        private val userRepository: UserRepository,
        private val httpClientAddressResolver: DefaultHttpClientAddressResolver,
        private val mailService: MailService
) {

    @Get
    fun get(principal: Principal): Mono<User> {
        return userRepository.findByEmail(principal.name).map { it.apply { it.password = null; it.ipAddress = null; it.confirmationUuid = null; } }
    }

    @Post
    @Secured(SecurityRule.IS_ANONYMOUS)
    @RateLimiter(name = "usercreate")
    open fun create(@Valid @Body userRequest: UserRequest, httpRequest: HttpRequest<User>): Mono<User> {
        return userRepository.findByEmail(userRequest.email!!)
                .flatMap { Mono.error<User> { IllegalStateException("User already exists with email ${userRequest.email}") } }
                .switchIfEmpty(
                        userRepository.save(User().also {
                            it.email = userRequest.email
                            it.password = BCrypt.hashpw(userRequest.password, BCrypt.gensalt(12))
                            it.ipAddress = httpClientAddressResolver.resolve(httpRequest)
                            it.confirmed = false
                            it.team = Team().also { it.id = userRequest.teamId } //todo validate this
                            it.confirmationUuid = UUID.randomUUID().toString()
                        }).flatMap { user ->
                            Mono.fromCallable { mailService.sendEmail(user.email!!, "Confirm Light The Lamp Account", "Welcome to Light The Lamp! Click here to confirm your account: https://www.lightthelamp.dev/login.html?confirmation=${user.confirmationUuid}") }
                                    .thenReturn(user)
                        }
                ).map { it.apply { it.password = null; it.ipAddress = null; confirmationUuid = null; } }
    }

    @Put(consumes = [MediaType.MULTIPART_FORM_DATA])
    fun update(profilePic: ByteArray?, displayName: String?, principal: Principal): Mono<User> {
        return userRepository.findByEmail(principal.name)
                .flatMap { userRepository.save(it.apply { it.profilePic = profilePic; it.displayName = displayName; }) }
                .map { it.apply { it.password = null; it.ipAddress = null; confirmationUuid = null; } }
    }

    @Get("/confirm/{uuid}")
    @Secured(SecurityRule.IS_ANONYMOUS)
    @RateLimiter(name = "usercreate")
    open fun confirm(@PathVariable uuid: String): Mono<User> {
        return userRepository.findOneByConfirmationUuidAndConfirmed(uuid, false).flatMap {
            userRepository.update(it.also { it.confirmed = true })
        }.map { it.apply { it.password = null; it.ipAddress = null; confirmationUuid = null; } }
    }

}
