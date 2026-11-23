package io.gray

import io.gray.model.Game
import io.gray.model.GamePlayer
import io.gray.model.GamePlayerId
import io.gray.model.League
import io.gray.model.Team
import io.gray.repos.GameRepository
import io.gray.repos.TeamRepository
import io.micronaut.context.annotation.Property
import io.micronaut.test.extensions.junit5.annotation.MicronautTest
import jakarta.inject.Inject
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.LocalDateTime
import java.time.ZoneOffset

/**
 * The current season is the newest season that has started, even when the latest game played belongs to
 * an older one: in Nov 2026 PWHL preseason games (202601) were still being played alongside NHL regular
 * season games (202602), and the site showed "2026-27 Pre" as the current season.
 */
@MicronautTest(transactional = false)
@Property(name = "datasources.flywaysrc.url", value = "jdbc:h2:mem:seasontest;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE;")
@Property(
    name = "r2dbc.datasources.default.url",
    value = "r2dbc:pool:h2:mem:///seasontest;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE"
)
class SeasonServiceTests {

    @Inject lateinit var gameRepository: GameRepository
    @Inject lateinit var teamRepository: TeamRepository

    @Test
    fun currentSeasonIsNewestStartedSeasonNotLatestGame() {
        val now = LocalDateTime.now(ZoneOffset.UTC)
        val nhl = (1L..2L).map { team(800 + it, League.NHL) }
        val pwhl = (3L..4L).map { team(800 + it, League.PWHL) }

        game(2026020100, "202602", League.NHL, nhl, now.minusDays(1))
        game(2026010100, "202601", League.PWHL, pwhl, now.minusHours(2)) // latest game, older season
        game(2026020200, "202602", League.NHL, nhl, now.plusDays(1))
        game(2027010100, "202701", League.NHL, nhl, now.plusMonths(9)) // not started yet

        assertThat(gameRepository.findLatestStartedSeason(now).block()).isEqualTo("202602")
        assertThat(gameRepository.findLatestStartedSeason(now.minusDays(2)).block()).isNull()
    }

    private fun team(id: Long, league: League) = teamRepository.save(Team().apply {
        this.id = id
        teamName = "Team $id"
        abbreviation = "T$id"
        shortName = "T$id"
        this.league = league
    }).block()!!

    private fun game(gameId: Long, season: String, league: League, teams: List<Team>, date: LocalDateTime) =
        gameRepository.save(Game().apply {
            id = gameId
            this.season = season
            this.league = league
            this.date = date
            gameState = "FUT"
            homeTeam = teams[0]
            awayTeam = teams[1]
            players = listOf(GamePlayer().apply {
                this.id = GamePlayerId(gameId, gameId * 10)
                team = teams[0]
                name = "Player"
                position = "Forward"
            })
        }).block()!!
}
