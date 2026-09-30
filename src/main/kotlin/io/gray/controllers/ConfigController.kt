package io.gray.controllers

import io.gray.model.Season
import io.gray.service.SeasonService
import io.micronaut.context.annotation.Value
import io.micronaut.core.annotation.Introspected
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import reactor.core.publisher.Mono

@Introspected
data class AppConfig(
    val allowAllPicks: Boolean,
    val currentSeason: String?,
    val seasons: List<Season>
)

// Server settings the frontend loads once at startup
@Secured(SecurityRule.IS_ANONYMOUS)
@Controller("/config")
class ConfigController(
    @Value("\${allow.all.picks:false}") private val allowAllPicks: Boolean,
    private val seasonService: SeasonService
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
    fun get(): Mono<AppConfig> = seasonService.getSeasons().map {
        AppConfig(allowAllPicks = allowAllPicks, currentSeason = it.current, seasons = it.all)
    }
}
