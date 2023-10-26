package io.gray.client

import io.gray.model.Pick
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("/pick")
interface PickClient {

        @Get
        fun getAll(@QueryValue season: String, @Header authorization: String): List<Pick>

        @Get("/{id}")
        fun get(@PathVariable id: Long, @Header authorization: String): Pick

        @Get("/user")
        fun getPickByUser(@QueryValue season: String, @Header authorization: String): List<Pick>

        @Get("/announcer")
        fun getPickByAnnouncer(@QueryValue season: String, @Header authorization: String): List<Pick>

        @Get("/friends")
        fun getPicksByUserFriends(@QueryValue season: String, @Header authorization: String): List<Pick>

        @Get("/friends-and-self")
        fun getPicksByUserFriendsAndUser(@QueryValue season: String, @Header authorization: String): List<Pick>

        @Get("/reddit")
        fun getPicksByReddit(@QueryValue season: String, @Header authorization: String): List<Pick>

        @Post("/user")
        fun createForUser(@QueryValue("gameId") gameId: String, @QueryValue("pick") pick: String, @QueryValue("teamId") teamId: Long, @Header authorization: String): Pick

        @Delete("/announcer")
        fun deleteForAnnouncer(@QueryValue("gameId") gameId: Long, @QueryValue("announcerId") announcerId: Long, @Header authorization: String): Long

        @Post("/announcer")
        fun createForAnnouncer(@QueryValue("gameId") gameId: String, @QueryValue("pick") pick: String, @QueryValue("announcerId") announcerId: Long, @Header authorization: String): Pick

}