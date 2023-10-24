package io.gray.client

import com.fasterxml.jackson.annotation.JsonProperty
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("/")
interface AuthClient {
        @Post("/login")
        fun login(@Body loginRequest: LoginRequest): LoginResponse
}
class LoginRequest(val username: String, val password: String)
class LoginResponse(@field:JsonProperty("access_token") val accessToken: String)