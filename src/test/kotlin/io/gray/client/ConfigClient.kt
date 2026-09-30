package io.gray.client

import io.gray.controllers.AppConfig
import io.micronaut.http.annotation.Get
import io.micronaut.http.client.annotation.Client

@Client("/config")
interface ConfigClient {

        @Get
        fun get(): AppConfig
}
