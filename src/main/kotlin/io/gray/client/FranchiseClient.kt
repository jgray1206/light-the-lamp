package io.gray.client

import io.gray.client.model.Franchises
import io.gray.client.model.Schedule
import io.micronaut.http.annotation.Consumes
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("\${nhl-franchise-api-base-path}")
interface FranchiseClient {
    @Get("/franchise")
    @Consumes("application/json")
    fun getFranchises(): Mono<Franchises>
}