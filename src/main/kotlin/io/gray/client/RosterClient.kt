package io.gray.client

import io.gray.client.model.Roster
import io.micronaut.http.annotation.Consumes
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("\${nhl-api-base-path}")
interface RosterClient {
    @Get("/roster/{team}/{season}")
    @Consumes("application/json")
    fun getRoster(
            @PathVariable(value = "team") teamAbbrev: String,
            @PathVariable(value = "season") season: String
    ): Mono<Roster>
}
