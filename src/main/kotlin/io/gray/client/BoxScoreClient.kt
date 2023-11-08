package io.gray.client

import io.gray.client.model.Boxscore
import io.gray.client.model.Roster
import io.micronaut.http.annotation.Consumes
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("\${nhl-api-base-path}")
interface BoxScoreClient {

    @Get("/gamecenter/{gameId}/boxscore")
    @Consumes("application/json")
    fun getBoxscore(
            @PathVariable(value = "gameId") gameId: String
    ): Mono<Boxscore>
}
