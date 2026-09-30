package io.gray.controllers

import io.micronaut.context.annotation.Value
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import org.slf4j.Logger
import org.slf4j.LoggerFactory

// Server settings the frontend needs to know about
@Secured(SecurityRule.IS_ANONYMOUS)
@Controller("/config")
class ConfigController(
    @Value("\${allow.all.picks:false}") private val allowAllPicks: Boolean
) {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    init {
        if (allowAllPicks) {
            logger.warn("ALLOW_ALL_PICKS is on: picks are allowed for games that have already started")
        }
    }

    @Get
    fun get(): Map<String, Boolean> = mapOf("allowAllPicks" to allowAllPicks)
}
