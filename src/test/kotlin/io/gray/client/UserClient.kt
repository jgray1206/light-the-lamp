package io.gray.client

import io.gray.model.*
import io.gray.repos.*
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import jakarta.validation.Valid
import jakarta.validation.constraints.Size
import java.security.Principal
import java.util.*

@Client("/user")
interface UserClient {

    @Get
    fun get(principal: Principal, @QueryValue profilePic: Boolean?): User

    @Get("/{id}/pic")
    fun getPic(id: Long): HttpResponse<String>

    @Post
    fun create(@Valid @Body userRequest: UserRequest, @Header("X-Forwarded-For") xForwardFor: String): User

    @Put
    fun update(profilePic: ByteArray?, displayName: String?, redditUsername: String?, teams: List<Long>?, @Size(min = 8, max = 50) password: String?): User

    @Get("/confirm/{uuid}")
    fun confirm(@PathVariable uuid: String): User

}
