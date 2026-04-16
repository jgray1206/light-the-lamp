package io.gray

import io.gray.client.AuthClient
import io.gray.client.LoginRequest
import io.gray.client.PickClient
import io.gray.client.UserClient
import io.gray.model.UserRequest
import io.gray.repos.*
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.http.client.multipart.MultipartBody
import io.micronaut.test.extensions.junit5.annotation.MicronautTest
import jakarta.inject.Inject
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.*
import org.mindrot.jbcrypt.BCrypt
import java.time.LocalDateTime

@MicronautTest(transactional = false, packages = ["io.gray"])
@TestMethodOrder(value = MethodOrderer.OrderAnnotation::class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LightTheLampApplicationTests {

	// ── Mock control flags ──────────────────────────────────────────────────────
	companion object {
		var mockReturnFinalScore = false
		var mockReturnUpdatedRoster = false

		// Team IDs
		const val RED_WINGS_ID = 17L
		const val WINGS_PARTNER_TEAM_ID = 18L
		const val KRAKEN_ID = 55L

		// Player IDs
		const val LARKIN_ID = 8477946L
		const val GOSTISBEHERE_ID = 8476906L
		const val SEIDER_ID = 8481542L
		const val WALMAN_ID = 8478013L
		const val SPRONG_ID = 8478466L

		// Game
		const val GAME_ID = 2023020091L

		// Season slug used in pick queries
		const val SEASON = "202302"

		// User credentials
		const val USER_EMAIL = "test@email.com"
		const val USER_PASSWORD = "testtest"
		const val USER_PASSWORD_UPDATED = "testtest2"
		const val USER_DISPLAY_NAME = "test mcgee"
	}

	// ── Injected dependencies ───────────────────────────────────────────────────

	@Inject lateinit var pickClient: PickClient
	@Inject lateinit var authClient: AuthClient
	@Inject lateinit var userClient: UserClient
	@Inject lateinit var gameRepository: GameRepository
	@Inject lateinit var gamePlayerRepository: GamePlayerRepository
	@Inject lateinit var teamRepository: TeamRepository
	@Inject lateinit var userRepository: UserRepository
	@Inject lateinit var userTeamRepository: UserTeamRepository
	@Inject lateinit var gameStateSyncer: GameStateSyncer

	// ── Shared test state ───────────────────────────────────────────────────────

	private lateinit var token: String

	// ── Helpers ─────────────────────────────────────────────────────────────────

	private fun login(email: String = USER_EMAIL, password: String = USER_PASSWORD): String =
			"Bearer " + authClient.login(LoginRequest(email, password)).accessToken

	private fun assertLoginFails(email: String = USER_EMAIL, password: String) {
		assertThrows<HttpClientResponseException> { authClient.login(LoginRequest(email, password)) }
	}

	private fun updateUser(
			displayName: String? = null,
			redditUsername: String? = null,
			password: String? = null,
			profilePic: String? = null,
			teams: String? = null,
			authToken: String = token
	) {
		val builder = MultipartBody.builder()
		displayName?.let { builder.addPart("displayName", it) }
		redditUsername?.let { builder.addPart("redditUsername", it) }
		password?.let { builder.addPart("password", it) }
		profilePic?.let { builder.addPart("profilePic", it) }
		teams?.let { builder.addPart("teams", it) }
		userClient.update(builder.build(), authToken)
	}

	// ── Test 1: Game state sync ─────────────────────────────────────────────────

	@Test
	@Order(1)
	fun gameStateSyncTests() {
		gameStateSyncer.syncAllGames(1)
		assertTeams()
		assertGames()
		assertGamePlayers()
		assertUpdatedRosterAddsPlayer()
	}

	private fun assertTeams() {
		val teams = teamRepository.findAll().collectList().block()!!
		assertThat(teams).hasSize(32)

		val redWings = teams.single { it.shortName == "Red Wings" }
		assertThat(redWings.id).isEqualTo(RED_WINGS_ID)
		assertThat(redWings.teamName).isEqualTo("Detroit Red Wings")
		assertThat(redWings.abbreviation).isEqualTo("DET")

		val kraken = teams.single { it.shortName == "Kraken" }
		assertThat(kraken.id).isEqualTo(KRAKEN_ID)
		assertThat(kraken.teamName).isEqualTo("Seattle Kraken")
		assertThat(kraken.abbreviation).isEqualTo("SEA")
	}

	private fun assertGames() {
		val games = gameRepository.findAll().collectList().block()!!
		assertThat(games).hasSize(46)

		val game = games.single { it.id == GAME_ID }
		assertThat(game.gameState).isEqualTo("Preview")
		assertThat(game.date).isEqualTo(LocalDateTime.of(2023, 10, 25, 0, 15))
		assertThat(game.homeTeam?.id).isEqualTo(RED_WINGS_ID)
		assertThat(game.awayTeam?.id).isEqualTo(KRAKEN_ID)
		assertThat(game.homeTeamGoals).isNull()
		assertThat(game.awayTeamGoals).isNull()
	}

	private fun assertGamePlayers() {
		val players = gamePlayerRepository.findAll().collectList().block()!!
				.filter { it.id?.gameId == GAME_ID }
		assertThat(players).hasSize(45)
		assertThat(players.filter { it.team?.id == RED_WINGS_ID }).hasSize(22)
		assertThat(players.filter { it.team?.id == KRAKEN_ID }).hasSize(23)
		players.forEach { player ->
			assertThat(player.id?.gameId).isEqualTo(GAME_ID)
			assertThat(player.id?.playerId).isNotNull()
			assertThat(player.name).isNotBlank()
		}
	}

	private fun assertUpdatedRosterAddsPlayer() {
		val countBefore = gamePlayerRepository.findAll().collectList().block()!!
				.count { it.id?.gameId == GAME_ID }
		mockReturnUpdatedRoster = true
		gameStateSyncer.syncAllGames(5)
		val countAfter = gamePlayerRepository.findAll().collectList().block()!!
				.count { it.id?.gameId == GAME_ID }
		assertThat(countAfter).isEqualTo(countBefore + 1)
	}

	// ── Test 2: User management ─────────────────────────────────────────────────

	@Test
	@Order(2)
	fun userTests() {
		assertLoginFailsBeforeUserExists()
		val userId = createUserAndAssertState()
		assertEmailConfirmationRequired()
		token = login()
		assertProfilePicAndUpdateRejections(userId)
		assertSuccessfulUpdate(userId)
		assertPasswordChangeRoundTrip()
		assertPartialUpdateClearsFields()
	}

	private fun assertLoginFailsBeforeUserExists() {
		assertLoginFails(password = USER_PASSWORD)
	}

	private fun createUserAndAssertState(): Long {
		val user = userClient.create(
				UserRequest().also {
					it.email = USER_EMAIL
					it.displayName = USER_DISPLAY_NAME
					it.password = USER_PASSWORD
					it.teams = listOf(RED_WINGS_ID, WINGS_PARTNER_TEAM_ID)
				}, "ip.address"
		)

		val dbUser = userRepository.findById(1).block()!!
		assertThat(dbUser.email).isEqualTo(USER_EMAIL)
		assertThat(dbUser.displayName).isEqualTo(USER_DISPLAY_NAME)
		assertThat(dbUser.redditUsername).isNull()
		assertThat(BCrypt.checkpw(USER_PASSWORD, dbUser.password)).isTrue()

		val userTeams = userTeamRepository.findByUserId(1).collectList().block()!!
		assertThat(userTeams).hasSize(2)
		assertThat(userTeams.map { it?.teamId }).containsExactly(RED_WINGS_ID, WINGS_PARTNER_TEAM_ID)

		// Unconfirmed users cannot log in
		assertLoginFails(password = USER_PASSWORD)
		return user.id!!
	}

	private fun assertEmailConfirmationRequired() {
		userClient.confirm(
				userRepository.findByEmailIgnoreCase(USER_EMAIL).block()?.confirmationUuid!!
		)
		assertLoginFails(password = USER_PASSWORD_UPDATED) // wrong password still fails after confirm
	}

	private fun assertProfilePicAndUpdateRejections(userId: Long) {
		// Unauthenticated pic fetch
		assertThrows<HttpClientResponseException> { userClient.getPic(userId, "") }
		// Authenticated but no pic yet
		assertThat(userClient.getPic(userId, token).body()).isNull()
		// Unauthenticated update
		assertThrows<HttpClientResponseException> {
			updateUser(displayName = "test mcgee 2", authToken = "")
		}
		// Blank display name rejected
		assertThrows<HttpClientResponseException> {
			updateUser(displayName = "", redditUsername = "redditname", authToken = token)
		}
	}

	private fun assertSuccessfulUpdate(userId: Long) {
		updateUser(
				displayName = "test mcgee 2",
				redditUsername = "redditname",
				profilePic = "test",
				teams = "$RED_WINGS_ID",
				password = USER_PASSWORD_UPDATED
		)

		val dbUser = userRepository.findById(1).block()!!
		assertThat(dbUser.displayName).isEqualTo("test mcgee 2")
		assertThat(dbUser.redditUsername).isEqualTo("redditname")
		assertThat(BCrypt.checkpw(USER_PASSWORD_UPDATED, dbUser.password)).isTrue()
		assertThat(BCrypt.checkpw(USER_PASSWORD, dbUser.password)).isFalse()
		assertThat(userClient.getPic(userId, token).body()).isEqualTo("dGVzdA==") // base64("test")
	}

	private fun assertPasswordChangeRoundTrip() {
		// New password works; old does not
		token = login(password = USER_PASSWORD_UPDATED)
		assertLoginFails(password = USER_PASSWORD)
	}

	private fun assertPartialUpdateClearsFields() {
		// Reset display name and clear reddit username, drop extra team
		updateUser(displayName = USER_DISPLAY_NAME, redditUsername = "")

		val dbUser = userRepository.findById(1).block()!!
		assertThat(dbUser.displayName).isEqualTo(USER_DISPLAY_NAME)
		assertThat(dbUser.redditUsername).isEqualTo("")

		val userTeams = userTeamRepository.findByUserId(1).collectList().block()!!
		assertThat(userTeams).hasSize(1)
		assertThat(userTeams.single()?.teamId).isEqualTo(RED_WINGS_ID)

		// Reset password back to original for subsequent tests
		updateUser(displayName = USER_DISPLAY_NAME, password = USER_PASSWORD)
		assertLoginFails(password = USER_PASSWORD_UPDATED)
	}

	// ── Test 3: Picks ───────────────────────────────────────────────────────────

	@Test
	@Order(3)
	fun pickTests() {
		setGameStartingIn(seconds = 10)
		assertUserPickFlow()
		assertAnnouncerPickFlow()
		assertPickScoring()
		assertAnnouncerPickDeletion()
	}

	private fun setGameStartingIn(seconds: Long) {
		gameRepository.update(
				gameRepository.findById(GAME_ID).block()!!.apply {
					date = LocalDateTime.now().plusSeconds(seconds)
				}
		).block()
	}

	private fun setGameStartedMinutesAgo(minutes: Int) {
		gameRepository.update(
				gameRepository.findById(GAME_ID).block()!!.apply {
					date = LocalDateTime.now().minusSeconds(minutes * 60L + 10)
				}
		).block()
	}

	private fun assertUserPickFlow() {
		val gameId = GAME_ID.toString()
		assertThat(pickClient.getAll(SEASON, token)).isEmpty()

		// Invalid player name rejected
		assertThrows<HttpClientResponseException> {
			pickClient.createForUser(gameId, "Dylan Lakin", RED_WINGS_ID, token)
		}
		// Player/team mismatch rejected
		assertThrows<HttpClientResponseException> {
			pickClient.createForUser(gameId, "Dylan Larkin", WINGS_PARTNER_TEAM_ID, token)
		}

		val larkinPick = pickClient.createForUser(gameId, "Dylan Larkin", RED_WINGS_ID, token)
		assertThat(larkinPick.id).isEqualTo(1)
		assertThat(larkinPick.user?.id).isEqualTo(1)
		assertThat(larkinPick.gamePlayer?.name).isEqualTo("Dylan Larkin")
		assertThat(larkinPick.team?.id).isEqualTo(RED_WINGS_ID)
		assertThat(larkinPick.theTeam).isNull()
		assertThat(larkinPick.goalies).isNull()
		assertThat(larkinPick.points).isNull()

		// Duplicate pick returns the same pick
		assertThat(pickClient.getAll(SEASON, token)).hasSize(1)
		assertThat(pickClient.createForUser(gameId, "Dylan Larkin", RED_WINGS_ID, token).id)
				.isEqualTo(larkinPick.id)
		assertThat(pickClient.getAll(SEASON, token)).hasSize(1)

		// Same user can pick for the opposing team
		val krakenPick = pickClient.createForUser(gameId, "Matty Beniers", KRAKEN_ID, token)
		assertThat(krakenPick.team?.id).isEqualTo(KRAKEN_ID)
		assertThat(krakenPick.id).isEqualTo(2)

		// Picks locked after game start
		setGameStartedMinutesAgo(6)
		assertThrows<HttpClientResponseException> {
			pickClient.createForUser(gameId, "Dylan Larkin", RED_WINGS_ID, token)
		}
	}

	private fun assertAnnouncerPickFlow() {
		val gameId = GAME_ID.toString()

		// Non-admin cannot create/delete announcer picks
		assertThrows<HttpClientResponseException> {
			pickClient.createForAnnouncer(gameId, "goalies", 1, token)
		}
		assertThrows<HttpClientResponseException> {
			pickClient.deleteForAnnouncer(GAME_ID, 1, token)
		}

		// Elevate to admin and re-login (token must reflect new role)
		userRepository.update(
				userRepository.findById(1).block()!!.apply { admin = true }
		).block()
		token = login()

		val goaliesPick = pickClient.createForAnnouncer(gameId, "goalies", 1, token)
		assertThat(goaliesPick.goalies).isTrue()
		assertThat(goaliesPick.theTeam).isNull()
		assertThat(goaliesPick.gamePlayer).isNull()

		// Slot 2: player, then override to "team"
		pickClient.createForAnnouncer(gameId, "Dylan Larkin", 2, token)
		val teamPick = pickClient.createForAnnouncer(gameId, "team", 2, token)
		assertThat(teamPick.theTeam).isTrue()
		assertThat(teamPick.goalies).isNull()
		assertThat(teamPick.gamePlayer).isNull()

		pickClient.createForAnnouncer(gameId, "Shayne Gostisbehere", 3, token)
		pickClient.createForAnnouncer(gameId, "Moritz Seider", 4, token)
		pickClient.createForAnnouncer(gameId, "Jake Walman", 5, token)
		pickClient.createForAnnouncer(gameId, "Daniel Sprong", 6, token)

		// 2 user picks + 6 announcer picks = 7 (all for Red Wings)
		val allPicks = pickClient.getAll(SEASON, token)
		assertThat(allPicks).hasSize(7)
		allPicks.forEach { pick ->
			assertThat(pick.team?.id).isEqualTo(RED_WINGS_ID)
			assertThat(pick.announcer ?: pick.user).isNotNull()
			assertThat(pick.points).isNull()
		}
	}

	private fun assertPickScoring() {
		mockReturnFinalScore = true
		// Sync multiple times to assert idempotency
		repeat(3) { attempt -> gameStateSyncer.syncAllGames(attempt + 10) }

		val picks = pickClient.getAll(SEASON, token)
		assertThat(picks).hasSize(7)
		picks.forEach { pick ->
			assertThat(pick.points).isNotNull()
		}

		fun pointsFor(playerId: Long) =
				picks.single { it.gamePlayer?.id?.playerId == playerId }.points

		assertThat(picks.single { it.goalies == true }.points).isEqualTo(0)
		assertThat(picks.single { it.theTeam == true }.points).isEqualTo(4)
		assertThat(pointsFor(LARKIN_ID)).isEqualTo(4)
		assertThat(pointsFor(GOSTISBEHERE_ID)).isEqualTo(5)
		assertThat(pointsFor(SEIDER_ID)).isEqualTo(2)
		assertThat(pointsFor(WALMAN_ID)).isEqualTo(0)
		assertThat(pointsFor(SPRONG_ID)).isEqualTo(1)
	}

	private fun assertAnnouncerPickDeletion() {
		pickClient.deleteForAnnouncer(GAME_ID, 6, token)
		assertThat(pickClient.getAll(SEASON, token)).hasSize(6)
	}
}