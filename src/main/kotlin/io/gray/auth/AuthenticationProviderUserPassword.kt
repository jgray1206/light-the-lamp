package io.gray.auth

import io.gray.repos.UserRepository
import io.micronaut.core.annotation.Nullable
import io.micronaut.http.HttpRequest
import io.micronaut.security.authentication.AuthenticationFailureReason
import io.micronaut.security.authentication.AuthenticationRequest
import io.micronaut.security.authentication.AuthenticationResponse
import io.micronaut.security.authentication.provider.HttpRequestReactiveAuthenticationProvider
import jakarta.inject.Singleton
import org.mindrot.jbcrypt.BCrypt
import org.reactivestreams.Publisher
import reactor.core.publisher.Mono


@Singleton
class AuthenticationProviderUserPassword(private val userRepository: UserRepository) : HttpRequestReactiveAuthenticationProvider<Any> {
    override fun authenticate(@Nullable requestContext: HttpRequest<Any>?, authenticationRequest: AuthenticationRequest<String, String>): Publisher<AuthenticationResponse> {
        return userRepository.findByEmail(authenticationRequest.identity as String).flatMap {
            if (it.locked == true) {
                Mono.error(AuthenticationResponse.exception(AuthenticationFailureReason.ACCOUNT_LOCKED))
            } else if (it.confirmed != true) {
                Mono.error(AuthenticationResponse.exception("Account not confirmed. Please check your email and click the confirmation link before signing in."))
            } else if ((it.attempts ?: 0) > 20) {
                userRepository.update(it.also { it.locked = true }).flatMap {
                    Mono.error(AuthenticationResponse.exception(AuthenticationFailureReason.ACCOUNT_LOCKED))
                }
            } else if (it.password != null && BCrypt.checkpw(authenticationRequest.secret as String, it.password)) {
                userRepository.update(it.also { it.attempts = 0 }).map { user ->
                    if (user.admin == true) {
                        AuthenticationResponse.success(authenticationRequest.identity as String, listOf("admin"), mapOf("id" to user.id))
                    } else {
                        AuthenticationResponse.success(authenticationRequest.identity as String, mapOf("id" to user.id))
                    }
                }
            } else {
                userRepository.update(it.also { it.attempts = it.attempts?.plus(1)?.toShort() ?: 1 }).flatMap {
                    Mono.error(AuthenticationResponse.exception(AuthenticationFailureReason.CREDENTIALS_DO_NOT_MATCH))
                }
            }
        }.switchIfEmpty(Mono.error(AuthenticationResponse.exception(AuthenticationFailureReason.CREDENTIALS_DO_NOT_MATCH)))
    }
}