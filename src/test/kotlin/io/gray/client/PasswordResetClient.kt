package io.gray.client

import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.client.annotation.Client

@Client("/passwordreset")
interface PasswordResetClient {

        @Post
        fun create(@QueryValue email: String): HttpResponse<Any>
}
