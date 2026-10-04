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
import reactor.core.publisher.Flux
import java.time.Duration
import java.time.LocalDateTime

/**
 * Scoring several games at once must not need more than one connection per game.
 * updatePoints used to open a transaction and then a second, nested one per player/team update,
 * so with the pool exhausted by outer transactions every game waited forever for a connection
 * (production hung silently with the pool at 20 connections).
 */
@MicronautTest(transactional = false)
@Property(name = "datasources.flywaysrc.url", value = "jdbc:h2:mem:pooltest;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE;")
@Property(
    name = "r2dbc.datasources.default.url",
    value = "r2dbc:pool:h2:mem:///pooltest;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE?initialSize=1&maxSize=2&maxAcquireTime=PT5S"
)
class ConnectionPoolTests {

    @Inject lateinit var gameStateSyncer: GameStateSyncer
    @Inject lateinit var gameRepository: GameRepository
    @Inject lateinit var teamRepository: TeamRepository

    @Test
    fun scoringMoreGamesThanConnectionsDoesNotDeadlock() {
        val teams = (1L..8L).map { id ->
            teamRepository.save(Team().apply {
                this.id = 900 + id
                teamName = "Team $id"
                abbreviation = "T$id"
                shortName = "T$id"
                league = League.NHL
            }).block()!!
        }
        // 4 games, 2 connections
        val gameIds = (0 until 4).map { i ->
            val gameId = 2099020000L + i
            val home = teams[i * 2]
            val away = teams[i * 2 + 1]
            gameRepository.save(Game().apply {
                id = gameId
                season = "209902"
                league = League.NHL
                date = LocalDateTime.now().minusHours(3)
                gameState = "Final"
                homeTeam = home
                awayTeam = away
                homeTeamGoals = 4
                awayTeamGoals = 2
                players = (1L..6L).map { p ->
                    GamePlayer().apply {
                        this.id = GamePlayerId(gameId, gameId * 10 + p)
                        team = if (p % 2 == 0L) home else away
                        name = "Player $p"
                        position = if (p <= 2) "Goalie" else "Forward"
                        goals = 1
                    }
                }
            }).block()!!.id!!
        }

        val games = gameIds.map { gameRepository.findById(it).block()!! }
        val updates = Flux.merge(games.map { gameStateSyncer.updatePoints(it) })
            .collectList()
            .block(Duration.ofSeconds(30))

        assertThat(updates).isNotNull()
    }
}
