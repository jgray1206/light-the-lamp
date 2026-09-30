package io.gray.service

import io.gray.model.Season
import io.gray.repos.GameRepository
import jakarta.inject.Singleton
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.LocalDateTime
import java.time.ZoneOffset

data class Seasons(val current: String?, val all: List<Season>)

/**
 * Seasons are derived from the games the syncers have created, so a new season shows up on its own
 * once its first game exists. Seasons change a few times a year, so the result is cached in memory.
 */
@Singleton
class SeasonService(private val gameRepository: GameRepository) {
    companion object {
        private val CACHE_TTL: Duration = Duration.ofMinutes(15)
    }

    private val seasons: Mono<Seasons> = Mono.defer {
        gameRepository.findAllSeasons().collectList()
            .zipWith(
                gameRepository.findLatestStartedSeason(LocalDateTime.now(ZoneOffset.UTC))
                    .map { listOf(it) }
                    .defaultIfEmpty(emptyList())
            )
            .map { tuple ->
                val all = tuple.t1
                // Before any game has started (a fresh database), fall back to the newest season
                Seasons(current = tuple.t2.firstOrNull() ?: all.firstOrNull(), all = all.map(Season::fromId))
            }
    }.cache({ CACHE_TTL }, { Duration.ZERO }, { Duration.ZERO })

    fun getSeasons(): Mono<Seasons> = seasons
}
