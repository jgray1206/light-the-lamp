package io.gray.client

import io.gray.client.model.TurnstileRequest
import io.gray.client.model.TurnstileResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Post
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("https://challenges.cloudflare.com/turnstile/v0/siteverify")
interface TurnstileClient {
    @Post
    fun checkTurnstileToken(@Body turnstileRequest: TurnstileRequest): Mono<TurnstileResponse>
}