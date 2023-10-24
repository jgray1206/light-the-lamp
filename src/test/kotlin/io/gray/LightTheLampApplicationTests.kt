package io.gray

import io.gray.client.AuthClient
import io.gray.client.LoginRequest
import io.gray.client.PickClient
import io.gray.client.UserClient
import io.gray.model.UserRequest
import io.gray.repos.GamePlayerRepository
import io.gray.repos.GameRepository
import io.gray.repos.TeamRepository
import io.gray.repos.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.test.extensions.junit5.annotation.MicronautTest
import jakarta.inject.Inject
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.*
import java.time.LocalDateTime

@MicronautTest(transactional = false, packages = ["io.gray"])
@TestMethodOrder(value = MethodOrderer.OrderAnnotation::class)
class LightTheLampApplicationTests {

	@Inject
	lateinit var pickClient: PickClient

	@Inject
	lateinit var authClient: AuthClient

	@Inject
	lateinit var userClient: UserClient

	@Inject
	lateinit var gameRepository: GameRepository

	@Inject
	lateinit var gamePlayerRepository: GamePlayerRepository

	@Inject
	lateinit var teamRepository: TeamRepository

	@Inject
	lateinit var userRepository: UserRepository

	@Inject
	lateinit var gameStateSyncer: GameStateSyncer


	@Test
	@Order(1)
	fun gameStateSyncTest() {
		gameStateSyncer.syncAllGames(1)

		val teams = teamRepository.findAll().collectList().block()!!
		assertThat(teams.size).isEqualTo(32)
		val redWings = teams.find { it.shortName == "Red Wings" }!!
		assertThat(redWings.id).isEqualTo(17)
		assertThat(redWings.teamName).isEqualTo("Detroit Red Wings")
		assertThat(redWings.shortName).isEqualTo("Red Wings")
		assertThat(redWings.abbreviation).isEqualTo("DET")
		val kraken = teams.find { it.shortName == "Kraken" }!!
		assertThat(kraken.id).isEqualTo(55)
		assertThat(kraken.teamName).isEqualTo("Seattle Kraken")
		assertThat(kraken.shortName).isEqualTo("Kraken")
		assertThat(kraken.abbreviation).isEqualTo("SEA")

		val games = gameRepository.findAll().collectList().block()!!
		assertThat(games.size).isEqualTo(1)

		val game = games.first()
		assertThat(game.id).isEqualTo(2023020091)
		assertThat(game.gameState).isEqualTo("Preview")
		assertThat(game.date).isEqualTo(LocalDateTime.of(2023, 10, 25, 0, 15))
		assertThat(game.homeTeam?.id).isEqualTo(redWings.id)
		assertThat(game.awayTeam?.id).isEqualTo(kraken.id)
		assertThat(game.homeTeamGoals).isNull()
		assertThat(game.awayTeamGoals).isNull()

		val players = gamePlayerRepository.findAll().collectList().block()!!
		assertThat(players.size).isEqualTo(47)
		val redWingsPlayers = players.filter { it.team?.id == redWings.id }
		assertThat(redWingsPlayers.size).isEqualTo(24)
		val krakenPlayers = players.filter { it.team?.id == kraken.id }
		assertThat(krakenPlayers.size).isEqualTo(23)
		players.forEach { player ->
			assertThat(player.id?.gameId).isEqualTo(game.id)
			assertThat(player.id?.playerId).isNotNull
			assertThat(player.name).isNotBlank()
		}
	}

	@Test
	@Order(2)
	fun createUserTest() {
		//authClient.login(LoginRequest("test@email.com", "testtest"))

		val user = userClient.create(
				UserRequest().also {
					it.email = "test@email.com"
					it.displayName = "test mcgee"
					it.password = "testtest"
					it.teams = listOf(17L)
				}, "ip.address"
		)
		//check fields
		userClient.confirm(userRepository.findByEmail("test@email.com").block()?.confirmationUuid!!)

		val token = authClient.login(LoginRequest("test@email.com", "testtest")).accessToken
		println(token)
	}



}
