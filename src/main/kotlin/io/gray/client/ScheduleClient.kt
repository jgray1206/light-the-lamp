package io.gray.client

import io.gray.client.model.Schedule
import io.micronaut.http.annotation.Consumes
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("\${nhl-api-base-path}")
interface ScheduleClient {
    @Get("/schedule/{date}")
    @Consumes("application/json")
    fun getSchedule(
            @PathVariable(value = "date") date: String,
    ): Mono<Schedule>
}