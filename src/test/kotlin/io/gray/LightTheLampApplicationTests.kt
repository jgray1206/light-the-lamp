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
import io.micronaut.http.client.exceptions.HttpClientException
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.test.extensions.junit5.annotation.MicronautTest
import jakarta.inject.Inject
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.*
import java.time.LocalDateTime

@MicronautTest(transactional = false, packages = ["io.gray"])
@TestMethodOrder(value = MethodOrderer.OrderAnnotation::class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LightTheLampApplicationTests {

	companion object {
		var RETURN_FINAL = false
		var RETURN_UPDATED_ROSTER = false
	}

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

	lateinit var token: String
	lateinit var gameId: String

	@Test
	@Order(1)
	fun gameStateSyncTests() {
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
		gameId = game.id.toString()
		assertThat(game.id).isEqualTo(2023020091)
		assertThat(game.gameState).isEqualTo("Preview")
		assertThat(game.date).isEqualTo(LocalDateTime.of(2023, 10, 25, 0, 15))
		assertThat(game.homeTeam?.id).isEqualTo(redWings.id)
		assertThat(game.awayTeam?.id).isEqualTo(kraken.id)
		assertThat(game.homeTeamGoals).isNull()
		assertThat(game.awayTeamGoals).isNull()

		val players = gamePlayerRepository.findAll().collectList().block()!!
		assertThat(players.size).isEqualTo(46)
		val redWingsPlayers = players.filter { it.team?.id == redWings.id }
		assertThat(redWingsPlayers.size).isEqualTo(23)
		val krakenPlayers = players.filter { it.team?.id == kraken.id }
		assertThat(krakenPlayers.size).isEqualTo(23)
		players.forEach { player ->
			assertThat(player.id?.gameId).isEqualTo(game.id)
			assertThat(player.id?.playerId).isNotNull
			assertThat(player.name).isNotBlank()
		}

		//test missing player logic
		RETURN_UPDATED_ROSTER = true
		gameStateSyncer.syncAllGames(5)
		assertThat(gamePlayerRepository.findAll().collectList().block()!!.size).isEqualTo(players.size+1)
	}

	@Test
	@Order(2)
	fun userTests() {
		assertThrows<HttpClientResponseException> {
			authClient.login(LoginRequest("test@email.com", "testtest"))
		}

		val user = userClient.create(
				UserRequest().also {
					it.email = "test@email.com"
					it.displayName = "test mcgee"
					it.password = "testtest"
					it.teams = listOf(17L)
				}, "ip.address"
		)

		assertThat(user.redditUsername).isNull()
		assertThat(user.teams?.size).isEqualTo(1)
		assertThat(user.teams?.get(0)?.id).isEqualTo(17)
		assertThrows<HttpClientResponseException> {
			authClient.login(LoginRequest("test@email.com", "testtest"))
		}

		//check fields
		userClient.confirm(userRepository.findByEmail("test@email.com").block()?.confirmationUuid!!)

		token = "Bearer " + authClient.login(LoginRequest("test@email.com", "testtest")).accessToken

		assertThrows<HttpClientResponseException> {
			userClient.getPic(user.id!!, "")
		}
		assertThat(userClient.getPic(user.id!!, token).body()).isNull()

		//userClient.update() test updating
	}

	@Test
	@Order(3)
	fun pickTests() {
		gameRepository.update(gameRepository.findById(gameId.toLong()).block().apply { this?.date = LocalDateTime.now().plusSeconds(10) }).block()
		assertThat(pickClient.getAll("202302", token).size).isEqualTo(0)
		assertThrows<HttpClientResponseException> {
			pickClient.createForUser(gameId, "Dylan Lakin", 17, token) //invalid pick
		}
		assertThrows<HttpClientResponseException> {
			pickClient.createForUser(gameId, "Dylan Larkin", 18, token) //invalid pick
		}
		val initialPick = pickClient.createForUser(gameId, "Dylan Larkin", 17, token)
		assertThat(initialPick.id).isEqualTo(1)
		assertThat(initialPick.user?.id).isEqualTo(1)
		assertThat(initialPick.theTeam).isNull()
		assertThat(initialPick.goalies).isNull()
		assertThat(initialPick.gamePlayer?.name).isEqualTo("Dylan Larkin")
		assertThat(initialPick.points).isNull()
		assertThat(initialPick.team?.id).isEqualTo(17)


		assertThat(pickClient.getAll("202302", token).size).isEqualTo(1)
		assertThat(pickClient.createForUser(gameId, "Dylan Larkin", 17, token).id).isEqualTo(initialPick.id)
		assertThat(pickClient.getAll("202302", token).size).isEqualTo(1)
		val otherTeamPick = pickClient.createForUser(gameId, "Matty Beniers", 55, token) //make sure same user can pick for both teams
		assertThat(otherTeamPick.team?.id).isEqualTo(55)
		assertThat(otherTeamPick.id).isEqualTo(2)
		gameRepository.update(gameRepository.findById(gameId.toLong()).block().apply { this?.date = LocalDateTime.now().minusSeconds(10) }).block()
		assertThrows<HttpClientResponseException> {
			pickClient.createForUser(gameId, "Dylan Larkin", 17, token)
		}

		//create some announcer picks
		assertThrows<HttpClientResponseException> {
			pickClient.createForAnnouncer(gameId, "goalies",1, token) //not an admin
		}
		assertThrows<HttpClientResponseException> {
			pickClient.deleteForAnnouncer(gameId.toLong(),1, token) //not an admin
		}
		userRepository.update(userRepository.findById(1).block().apply { this?.admin = true }).block()
		token = "Bearer " + authClient.login(LoginRequest("test@email.com", "testtest")).accessToken

		val goaliesPick = pickClient.createForAnnouncer(gameId, "goalies",1, token)
		assertThat(goaliesPick.goalies).isTrue
		assertThat(goaliesPick.theTeam).isNull()
		assertThat(goaliesPick.gamePlayer).isNull()
		pickClient.createForAnnouncer(gameId, "Dylan Larkin", 2, token) //make sure updates work
		val teamPick = pickClient.createForAnnouncer(gameId, "team", 2, token)
		assertThat(teamPick.theTeam).isTrue
		assertThat(teamPick.goalies).isNull()
		assertThat(teamPick.gamePlayer).isNull()
		pickClient.createForAnnouncer(gameId, "Shayne Gostisbehere", 3, token)
		pickClient.createForAnnouncer(gameId, "Moritz Seider", 4, token)
		pickClient.createForAnnouncer(gameId, "Jake Walman", 5, token)
		pickClient.createForAnnouncer(gameId, "Daniel Sprong", 6, token)

		val allPicksBeforeScore = pickClient.getAll("202302", token)
		assertThat(allPicksBeforeScore).hasSize(7)
		allPicksBeforeScore.forEach { pick ->
			assertThat(pick.id).isNotNull
			assertThat(pick.team?.id).isEqualTo(17)
			assertThat(pick.announcer ?: pick.user).isNotNull
			assertThat(pick.points).isNull()
		}

		//score picks
		RETURN_FINAL = true
		gameStateSyncer.syncAllGames(10)
		gameStateSyncer.syncAllGames(12)
		gameStateSyncer.syncAllGames(15)
		val allPicksAfterScore = pickClient.getAll("202302", token)
		assertThat(allPicksAfterScore).hasSize(7)
		allPicksAfterScore.forEach { pick ->
			assertThat(pick.id).isNotNull
			assertThat(pick.team?.id).isEqualTo(17)
			assertThat(pick.announcer ?: pick.user).isNotNull
			assertThat(pick.points).isNotNull()
		}

		assertThat(allPicksAfterScore.first { it.goalies == true }.points).isEqualTo(0)
		assertThat(allPicksAfterScore.first { it.theTeam == true }.points).isEqualTo(4)
		assertThat(allPicksAfterScore.first { it.gamePlayer?.id?.playerId == 8477946L }.points).isEqualTo(4) //larkin
		assertThat(allPicksAfterScore.first { it.gamePlayer?.id?.playerId == 8476906L }.points).isEqualTo(5) //gosti
		assertThat(allPicksAfterScore.first { it.gamePlayer?.id?.playerId == 8481542L }.points).isEqualTo(2) //seider
		assertThat(allPicksAfterScore.first { it.gamePlayer?.id?.playerId == 8478013L }.points).isEqualTo(0) //walman
		assertThat(allPicksAfterScore.first { it.gamePlayer?.id?.playerId == 8478466L }.points).isEqualTo(1) //sprong

		pickClient.deleteForAnnouncer(gameId.toLong(), 6, token)
		assertThat(pickClient.getAll("202302", token)).hasSize(6) //test announcer deletion
	}



}
