package io.gray.client

import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.client.annotation.Client

// Raw response bodies, to pin down the JSON shapes the frontend reads
@Client("/")
interface RawJsonClient {

        @Get("/game/{id}")
        fun game(@PathVariable id: Long, @Header authorization: String): String

        @Get("/pick/user")
        fun myPicks(@QueryValue season: String, @Header authorization: String): String

        @Get("/user")
        fun user(@QueryValue profilePic: Boolean?, @Header authorization: String): String
}
