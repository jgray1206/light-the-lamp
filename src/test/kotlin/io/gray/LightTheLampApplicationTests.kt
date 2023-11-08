package io.gray

import io.gray.client.AuthClient
import io.gray.client.LoginRequest
import io.gray.client.PickClient
import io.gray.client.UserClient
import io.gray.model.UserRequest
import io.gray.repos.*
import io.micronaut.http.HttpResponse
import io.micronaut.http.client.exceptions.HttpClientException
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.http.client.multipart.MultipartBody
import io.micronaut.http.multipart.MultipartException
import io.micronaut.test.extensions.junit5.annotation.MicronautTest
import jakarta.inject.Inject
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.*
import org.mindrot.jbcrypt.BCrypt
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
	lateinit var userTeamRepository: UserTeamRepository

	@Inject
	lateinit var gameStateSyncer: GameStateSyncer

	lateinit var token: String
	lateinit var gameId: String

	@Test
	@Order(1)
	fun gameStateSyncTests() {
		gameStateSyncer.syncAllGames(1)

		val teams = teamRepository.findAll().collectList().block()!!
		assertThat(teams).hasSize(32)
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
		assertThat(games).hasSize(46)

		val game = games.first { it.id == 2023020091L }
		gameId = game.id.toString()
		assertThat(game.id).isEqualTo(2023020091)
		assertThat(game.gameState).isEqualTo("Preview")
		assertThat(game.date).isEqualTo(LocalDateTime.of(2023, 10, 25, 0, 15))
		assertThat(game.homeTeam?.id).isEqualTo(redWings.id)
		assertThat(game.awayTeam?.id).isEqualTo(kraken.id)
		assertThat(game.homeTeamGoals).isNull()
		assertThat(game.awayTeamGoals).isNull()

		val players = gamePlayerRepository.findAll().collectList().block()!!.filter { it.id?.gameId == gameId.toLong() }
		assertThat(players).hasSize(45)
		val redWingsPlayers = players.filter { it.team?.id == redWings.id }
		assertThat(redWingsPlayers).hasSize(22)
		val krakenPlayers = players.filter { it.team?.id == kraken.id }
		assertThat(krakenPlayers).hasSize(23)
		players.forEach { player ->
			assertThat(player.id?.gameId).isEqualTo(game.id)
			assertThat(player.id?.playerId).isNotNull
			assertThat(player.name).isNotBlank()
		}

		//test missing player logic
		RETURN_UPDATED_ROSTER = true
		gameStateSyncer.syncAllGames(5)
		assertThat(gamePlayerRepository.findAll().collectList().block()!!.filter { it.id?.gameId == gameId.toLong() }).hasSize(players.size+1)
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
					it.teams = listOf(17L, 18L)
				}, "ip.address"
		)

		val dbUserAfterCreate = userRepository.findById(1).block()!!
		assertThat(dbUserAfterCreate.redditUsername).isNull()
		assertThat(dbUserAfterCreate.email).isEqualTo("test@email.com")
		assertThat(dbUserAfterCreate.displayName).isEqualTo("test mcgee")

		val userTeamsAfterCreate = userTeamRepository.findByUserId(1).collectList().block()!!
		assertThat(userTeamsAfterCreate).hasSize(2)
		assertThat(userTeamsAfterCreate[0]?.teamId).isEqualTo(17)
		assertThat(userTeamsAfterCreate[1]?.teamId).isEqualTo(18)
		assertThrows<HttpClientResponseException> {
			authClient.login(LoginRequest("test@email.com", "testtest"))
		}

		val dbUser = userRepository.findById(1).block()!!
		assertThat(BCrypt.checkpw("testtest", dbUser.password)).isTrue
		assertThat(BCrypt.checkpw("testtest2", dbUser.password)).isFalse

		//check fields
		userClient.confirm(userRepository.findByEmail("test@email.com").block()?.confirmationUuid!!)
		assertThrows<HttpClientResponseException> {
			authClient.login(LoginRequest("test@email.com", "testtest2"))
		}

		token = "Bearer " + authClient.login(LoginRequest("test@email.com", "testtest")).accessToken

		assertThrows<HttpClientResponseException> {
			userClient.getPic(user.id!!, "")
		}
		assertThat(userClient.getPic(user.id!!, token).body()).isNull()
		assertThrows<HttpClientResponseException> {
			userClient.update(MultipartBody.builder()
					.addPart("profilePic", "test")
					.addPart("displayName", "test mcgee 2")
					.addPart("redditUsername", "redditname")
					.addPart("teams", "[17]")
					.addPart("password", "testtest2").build(), "")
		}
		assertThrows<HttpClientResponseException> {
			userClient.update(MultipartBody.builder()
					.addPart("profilePic", "test")
					.addPart("displayName", "")
					.addPart("redditUsername", "redditname")
					.addPart("teams", "[17]")
					.addPart("password", "testtest2").build(), token)
		}
		userClient.update(MultipartBody.builder()
				.addPart("profilePic", "test")
				.addPart("displayName", "test mcgee 2")
				.addPart("redditUsername", "redditname")
				.addPart("teams", "17")
				.addPart("password", "testtest2").build(), token)
		val dbUserAfterUpdate = userRepository.findById(1).block()!!
		assertThat(dbUserAfterUpdate.displayName).isEqualTo("test mcgee 2")
		assertThat(dbUserAfterUpdate.redditUsername).isEqualTo("redditname")
		assertThat(userClient.getPic(user.id!!, token).body()).isEqualTo("dGVzdA==")
		assertThat(BCrypt.checkpw("testtest", dbUserAfterUpdate.password)).isFalse
		assertThat(BCrypt.checkpw("testtest2", dbUserAfterUpdate.password)).isTrue
		authClient.login(LoginRequest("test@email.com", "testtest2"))
		assertThrows<HttpClientResponseException> {
			authClient.login(LoginRequest("test@email.com", "testtest"))
		}

		userClient.update(MultipartBody.builder()
				.addPart("displayName", "test mcgee")
				.addPart("redditUsername", "").build(), token)
		val userTeamsAfterUpdate = userTeamRepository.findByUserId(1).collectList().block()!!
		assertThat(userTeamsAfterUpdate).hasSize(1)
		assertThat(userTeamsAfterUpdate[0]?.teamId).isEqualTo(17)
		val dbUserAfterUpdate2 = userRepository.findById(1).block()!!
		assertThat(dbUserAfterUpdate2.displayName).isEqualTo("test mcgee")
		assertThat(dbUserAfterUpdate2.redditUsername).isEqualTo("")
		assertThat(userClient.getPic(user.id!!, token).body()).isEqualTo("dGVzdA==")
		authClient.login(LoginRequest("test@email.com", "testtest2"))

		userClient.update(MultipartBody.builder()
				.addPart("displayName", "test mcgee")
				.addPart("password", "testtest").build(), token)
		assertThrows<HttpClientResponseException> {
			authClient.login(LoginRequest("test@email.com", "testtest2"))
		}
	}

	@Test
	@Order(3)
	fun pickTests() {
		gameRepository.update(gameRepository.findById(gameId.toLong()).block().apply { this?.date = LocalDateTime.now().plusSeconds(10) }).block()
		assertThat(pickClient.getAll("202302", token)).hasSize(0)
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


		assertThat(pickClient.getAll("202302", token)).hasSize(1)
		assertThat(pickClient.createForUser(gameId, "Dylan Larkin", 17, token).id).isEqualTo(initialPick.id)
		assertThat(pickClient.getAll("202302", token)).hasSize(1)
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
