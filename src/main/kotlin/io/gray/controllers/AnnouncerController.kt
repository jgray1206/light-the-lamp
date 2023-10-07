package io.gray.controllers

import io.gray.model.*
import io.gray.repos.AnnouncerRepository
import io.gray.repos.TeamRepository
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import reactor.core.publisher.Flux

@Secured(SecurityRule.IS_ANONYMOUS)
@Controller("/announcers")
class AnnouncerController(
        private val announcerRepository: AnnouncerRepository
) {
    @Get
    fun getAnnouncers(): Flux<Announcer> {
        return announcerRepository.findAll()
    }
}
