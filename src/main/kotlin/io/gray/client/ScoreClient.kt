package io.gray.client

import io.gray.client.model.Score
import io.micronaut.http.annotation.Consumes
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("\${nhl-api-base-path}")
interface ScoreClient {
    @Get("/score/{date}")
    @Consumes("application/json")
    fun getScore(
        @PathVariable(value = "date") date: String
    ): Mono<Score>
}