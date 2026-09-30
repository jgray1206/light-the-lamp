package io.gray.client

import io.gray.model.AdminUserDetail
import io.gray.model.AdminUserSummary
import io.gray.model.Game
import io.gray.model.Pick
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client

@Client("/admin")
interface AdminClient {

        @Get("/users")
        fun searchUsers(@QueryValue q: String, @Header authorization: String): List<AdminUserSummary>

        @Get("/users/{id}")
        fun getUser(@PathVariable id: Long, @Header authorization: String): AdminUserDetail

        @Get("/users/{id}/picks")
        fun getPicks(@PathVariable id: Long, @QueryValue season: String, @Header authorization: String): List<Pick>

        @Get("/games")
        fun getGames(@QueryValue teamId: Long, @QueryValue season: String, @Header authorization: String): List<Game>

        @Put("/users/{id}/picks")
        fun setPick(
                @PathVariable id: Long,
                @QueryValue gameId: Long,
                @QueryValue teamId: Long,
                @QueryValue pick: String,
                @Header authorization: String
        ): Pick

        @Delete("/users/{id}/picks")
        fun deletePick(
                @PathVariable id: Long,
                @QueryValue gameId: Long,
                @QueryValue teamId: Long,
                @Header authorization: String
        ): Long
}
