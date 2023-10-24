package io.gray.controllers

import io.github.resilience4j.micronaut.annotation.RateLimiter
import io.gray.email.MailService
import io.gray.model.PasswordReset
import io.gray.repos.PasswordResetRepository
import io.gray.repos.UserRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import org.mindrot.jbcrypt.BCrypt
import reactor.core.publisher.Mono
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*


@Secured(SecurityRule.IS_ANONYMOUS)
@Controller("/passwordreset")
open class PasswordResetController(
        private val userRepository: UserRepository,
        private val passwordResetRepository: PasswordResetRepository,
        private val mailService: MailService
) {

    @Post
    @Secured(SecurityRule.IS_ANONYMOUS)
    @RateLimiter(name = "passwordreset")
    open fun create(@NotEmpty @QueryValue email: String): Mono<Void> {
        return userRepository.findByEmail(email)
                .flatMap { user ->
                    passwordResetRepository.findByUserId(user.id!!).any {
                        it.createTime?.isBefore(Instant.now().plus(1, ChronoUnit.HOURS)) == true
                    }.map {
                        if (it) {
                            error("please wait an hour before submitting another password reset request")
                        }
                    }.flatMap {
                        passwordResetRepository.save(
                                PasswordReset().apply {
                                    this.user = user
                                    this.resetUuid = UUID.randomUUID().toString()
                                }
                        )
                    }
                }.map { passwordReset ->
                    mailService.sendEmail(email, "Light the Lamp - Password Reset Request",
                            """
                                Your password has been reset! The following link will only be active for one hour. Click it to reset the password for this email account.
                                
                                https://www.lightthelamp.dev/passwordreset.html?resetUuid=${passwordReset.resetUuid}
                                
                                If you did not request this reset, please respond to this email saying so.
                            """.trimIndent())
                }.then(Mono.empty())
    }

    @Put
    @Secured(SecurityRule.IS_ANONYMOUS)
    @RateLimiter(name = "passwordreset")
    open fun resetPassword(@QueryValue uuid: String, @QueryValue @NotBlank @Size(min = 8, max = 50) password: String): Mono<Void> {
        return passwordResetRepository.findByResetUuid(uuid).switchIfEmpty(Mono.error { error("password reset request not found, please submit another one.") }).flatMap { passwordReset ->
            if (passwordReset.createTime?.isBefore(Instant.now().plus(1, ChronoUnit.HOURS)) == true) {
                val user = passwordReset.user!!
                user.password = BCrypt.hashpw(password, BCrypt.gensalt(12))
                userRepository.update(user)
            } else {
                error("password reset expired, please submit another one.")
            }
        }.flatMap { passwordResetRepository.findByResetUuid(uuid) }
                .flatMap { passwordResetRepository.delete(it) }
                .then(Mono.empty())
    }

}
