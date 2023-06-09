package io.gray.controllers

import io.github.resilience4j.micronaut.annotation.RateLimiter
import io.gray.model.UserRequest
import io.gray.email.MailService
import io.gray.model.Team
import io.gray.model.User
import io.gray.model.UserTeam
import io.gray.repos.UserRepository
import io.gray.repos.UserTeamRepository
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpResponse
import io.micronaut.http.MediaType
import io.micronaut.http.annotation.*
import io.micronaut.http.server.util.DefaultHttpClientAddressResolver
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import org.mindrot.jbcrypt.BCrypt
import reactor.core.publisher.Flux
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
        private val userTeamRepository: UserTeamRepository,
        private val mailService: MailService
) {

    @Get
    fun get(principal: Principal): Mono<User> {
        return userRepository.findByEmail(principal.name).map {
            it.apply {
                it.password = null
                it.ipAddress = null
                it.friends = it.friends?.map { friend ->
                    friend.apply {
                        this.password = null
                        this.email = null
                        this.ipAddress = null
                        this.profilePic = byteArrayOf()
                    }
                }
            }
        }
    }

    @Get("/{id}/pic")
    fun getPic(id: Long): Mono<HttpResponse<String>> {
        return userRepository.findById(id).map {
            HttpResponse.ok(String(Base64.getEncoder().encode(it.profilePic))).header("Cache-Control", "max-age=86400")
        }
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
                            it.displayName = userRequest.displayName
                            it.confirmationUuid = UUID.randomUUID().toString()
                        }).flatMap { user ->
                            Mono.fromCallable { mailService.sendEmail(user.email!!, "Confirm Light The Lamp Account", "Welcome to Light The Lamp! Click here to confirm your account: https://www.lightthelamp.dev/login.html?confirmation=${user.confirmationUuid}") }
                                    .thenReturn(user)
                        }
                ).flatMapMany { user ->
                    Flux.fromIterable(userRequest.teams ?: listOf()).flatMap { team ->
                        userTeamRepository.save(
                                UserTeam().also {
                                    it.userId = user.id; it.teamId = team
                                })
                    }
                }.then(userRepository.findByEmail(userRequest.email!!)).map { it.apply { it.password = null; it.ipAddress = null; confirmationUuid = null; } }
    }

    @Put(consumes = [MediaType.MULTIPART_FORM_DATA])
    fun update(profilePic: ByteArray?, displayName: String?, teams: List<Long>?, principal: Principal): Mono<User> {
        return userRepository.findByEmail(principal.name)
                .flatMap { user ->
                    teams?.let { teams ->
                        user.teams?.let { userTeams ->
                            Flux.fromIterable(userTeams).filter { it.id !in teams }
                                    .flatMap { userTeamRepository.findByUserIdAndTeamId(user.id!!, it.id!!) }
                                    .flatMap { userTeamRepository.delete(it) }.thenMany(
                                            Flux.fromIterable(teams).filter { it !in userTeams.mapNotNull { userTeam -> userTeam.id } }
                                                    .map { UserTeam().apply { this.userId = user.id; this.teamId = it; } }
                                                    .flatMap { userTeamRepository.save(it) }
                                    ).then(Mono.just(user))
                        } ?: Mono.just(user)
                    } ?: Mono.just(user)
                }.flatMap { user ->3
                    userRepository.update(user.apply {
                        profilePic?.let { this.profilePic = it }
                        displayName?.let { this.displayName = it }
                    })
                }
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
