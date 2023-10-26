package io.gray.client

import io.gray.model.*
import io.gray.repos.*
import io.micronaut.http.HttpResponse
import io.micronaut.http.MediaType
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.multipart.MultipartBody
import jakarta.validation.Valid
import jakarta.validation.constraints.Size
import java.security.Principal
import java.util.*

@Client("/user")
interface UserClient {

    @Get
    fun get(@QueryValue profilePic: Boolean?): User

    @Get("/{id}/pic")
    fun getPic(id: Long, @Header authorization: String): HttpResponse<String>

    @Post
    fun create(@Valid @Body userRequest: UserRequest, @Header("X-Forwarded-For") xForwardFor: String): User

    @Put(produces = [MediaType.MULTIPART_FORM_DATA])
    fun update(@Body body: MultipartBody, @Header authorization: String): User

    @Get("/confirm/{uuid}")
    fun confirm(@PathVariable uuid: String): User

}
