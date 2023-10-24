package io.gray.client

import io.gray.model.Pick
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.security.Principal

@Client("/pick")
interface PickClient {

        @Get
        fun getAll(principal: Principal, @QueryValue season: String, @Header authentication: String): Flux<Pick>

        @Get("/{id}")
        fun get(@PathVariable id: Long, @Header authentication: String): Mono<Pick>

        @Get("/user")
        fun getPickByUser(principal: Principal, @QueryValue season: String, @Header authentication: String): Flux<Pick>

        @Get("/announcer")
        fun getPickByAnnouncer(@QueryValue season: String, @Header authentication: String): Flux<Pick>

        @Get("/friends")
        fun getPicksByUserFriends(principal: Principal, @QueryValue season: String, @Header authentication: String): Flux<Pick>

        @Get("/friends-and-self")
        fun getPicksByUserFriendsAndUser(principal: Principal, @QueryValue season: String, @Header authentication: String): Flux<Pick>

        @Get("/reddit")
        fun getPicksByReddit(principal: Principal, @QueryValue season: String, @Header authentication: String): Flux<Pick>

        @Post("/user")
        fun createForUser(@QueryValue("gameId") gameId: String, @QueryValue("pick") pick: String, @QueryValue("teamId") teamId: Long, @Header authentication: String): Mono<Pick>

        @Delete("/announcer")
        fun deleteForAnnouncer(@QueryValue("gameId") gameId: Long, @QueryValue("announcerId") announcerId: Long, @Header authentication: String): Mono<Long>

        @Post("/announcer")
        fun createForAnnouncer(@QueryValue("gameId") gameId: String, @QueryValue("pick") pick: String, @QueryValue("announcerId") announcerId: Long, @Header authentication: String): Mono<Pick>

}