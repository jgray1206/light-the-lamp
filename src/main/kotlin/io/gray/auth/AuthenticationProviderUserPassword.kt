package io.gray.auth

import io.gray.repos.UserRepository
import io.micronaut.core.annotation.Nullable
import io.micronaut.http.HttpRequest
import io.micronaut.security.authentication.AuthenticationFailureReason
import io.micronaut.security.authentication.AuthenticationProvider
import io.micronaut.security.authentication.AuthenticationRequest
import io.micronaut.security.authentication.AuthenticationResponse
import jakarta.inject.Singleton
import org.mindrot.jbcrypt.BCrypt
import org.reactivestreams.Publisher
import reactor.core.publisher.Mono


@Singleton
class AuthenticationProviderUserPassword(private val userRepository: UserRepository) : AuthenticationProvider {
    override fun authenticate(@Nullable httpRequest: HttpRequest<*>?,
                              authenticationRequest: AuthenticationRequest<*, *>): Publisher<AuthenticationResponse?>? {
        return userRepository.findByEmail(authenticationRequest.identity as String).flatMap {
            if (it.locked == true) {
                Mono.just(AuthenticationResponse.failure(AuthenticationFailureReason.ACCOUNT_LOCKED))
            } else if ((it.attempts ?: 0) > 20) {
                userRepository.update(it.also { it.locked = true }).map {
                    AuthenticationResponse.failure(AuthenticationFailureReason.ACCOUNT_LOCKED)
                }
            } else if (it.password != null && BCrypt.checkpw(authenticationRequest.secret as String, it.password)) {
                userRepository.update(it.also { it.attempts = 0 }).map { AuthenticationResponse.success(authenticationRequest.identity as String) }
            } else {
                userRepository.update(it.also { it.attempts = it.attempts?.plus(1)?.toShort() ?: 1 }).map {
                    AuthenticationResponse.failure(AuthenticationFailureReason.CREDENTIALS_DO_NOT_MATCH)
                }
            }
        }.switchIfEmpty(Mono.just(AuthenticationResponse.failure(AuthenticationFailureReason.CREDENTIALS_DO_NOT_MATCH)))
    }
}