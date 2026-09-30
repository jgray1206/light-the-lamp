package io.gray.service

import io.gray.GameStateSyncer
import io.gray.model.*
import io.gray.repos.GameRepository
import io.gray.repos.PickRepository
import io.gray.repos.UserRepository
import jakarta.inject.Singleton
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.util.Base64

/**
 * Admin fixes for users' goofed picks. Changes must still be legal picks: the team must be one of the
 * user's teams and playing in the game, and the pick can't repeat one from the team's previous two
 * games — or the next two, since that would make those later picks illegal.
 * Every change is logged with the admin's email.
 */
@Singleton
class AdminService(
    private val userRepository: UserRepository,
    private val gameRepository: GameRepository,
    private val pickRepository: PickRepository,
    private val gameStateSyncer: GameStateSyncer
) {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    fun searchUsers(query: String): Flux<AdminUserSummary> {
        val trimmed = query.trim().lowercase()
        if (trimmed.length < 2) return Flux.empty()
        val escaped = trimmed.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        return userRepository.searchForAdmin("%$escaped%")
    }

    fun getUser(userId: Long): Mono<AdminUserDetail> =
        loadUser(userId).flatMap { user ->
            val parent = user.parent?.id?.let { userRepository.findById(it) } ?: Mono.empty()
            teamsOf(user).zipWith(parent.map { listOf(it) }.defaultIfEmpty(emptyList())).map { tuple ->
                val teams = tuple.t1
                user.parent = tuple.t2.firstOrNull()
                AdminUserDetail(
                    id = user.id!!,
                    email = user.email,
                    displayName = user.displayName,
                    redditUsername = user.redditUsername,
                    confirmed = user.confirmed,
                    locked = user.locked,
                    profilePic = Base64.getEncoder().encodeToString(user.profilePic),
                    teams = teams.sortedBy { it.teamName },
                    kids = user.kids.orEmpty().map { AdminUserRef(it.id!!, it.email, it.displayName) },
                    parent = user.parent?.let { AdminUserRef(it.id!!, it.email, it.displayName) }
                )
            }
        }

    fun getPicks(userId: Long, season: String): Flux<Pick> =
        pickRepository.findAllByUserAndSeason(UserDTO().apply { id = userId }, season)

    fun getGames(teamId: Long, season: String): Flux<Game> =
        gameRepository.findTopByHomeTeamOrAwayTeamAndSeasonOrderByIdDesc(teamId, teamId, season, 200)
            .collectList()
            .flatMapMany { gameRepository.findByIdIn(it) }

    fun setPick(adminEmail: String, userId: Long, gameId: Long, teamId: Long, pick: String): Mono<Pick> =
        loadContext(userId, gameId, teamId).flatMap { ctx ->
            val game = ctx.game
            val gamePlayer = when (pick) {
                "goalies", "team" -> null
                else -> game.players?.firstOrNull { it.name == pick && it.team?.id == teamId }
                    ?: error("$pick isn't a player for that team in that game")
            }
            checkCooldown(ctx, pick).then(
                pickRepository.findByGameAndUserAndTeam(game, ctx.userDTO, ctx.team)
                    .map { existing -> existing to describe(existing) }
                    .defaultIfEmpty(Pick() to "(no pick)")
                    .flatMap { (entity, before) ->
                        entity.apply {
                            this.game = game
                            this.season = game.season
                            this.team = ctx.team
                            this.user = ctx.userDTO
                            this.goalies = if (pick == "goalies") true else null
                            this.theTeam = if (pick == "team") true else null
                            this.gamePlayer = gamePlayer
                            this.points = null
                        }
                        logger.warn(
                            "ADMIN $adminEmail changed pick for user $userId (${ctx.user.email ?: ctx.user.displayName}), " +
                                "game $gameId, team $teamId: $before -> $pick"
                        )
                        if (entity.id == null) pickRepository.save(entity) else pickRepository.update(entity)
                    }
            ).flatMap { saved ->
                recalculatePoints(game).then(
                    pickRepository.findByGameAndUserAndTeam(game, ctx.userDTO, ctx.team).defaultIfEmpty(saved)
                )
            }
        }

    fun deletePick(adminEmail: String, userId: Long, gameId: Long, teamId: Long): Mono<Long> =
        loadContext(userId, gameId, teamId).flatMap { ctx ->
            pickRepository.findByGameAndUserAndTeam(ctx.game, ctx.userDTO, ctx.team)
                .switchIfEmpty(Mono.error(IllegalStateException("that user has no pick for that game")))
                .flatMap { existing ->
                    logger.warn(
                        "ADMIN $adminEmail deleted pick for user $userId (${ctx.user.email ?: ctx.user.displayName}), " +
                            "game $gameId, team $teamId: ${describe(existing)}"
                    )
                    pickRepository.delete(existing)
                }
        }

    private data class PickContext(val user: User, val userDTO: UserDTO, val team: Team, val game: Game)

    private fun loadContext(userId: Long, gameId: Long, teamId: Long): Mono<PickContext> =
        loadUser(userId)
            .zipWith(gameRepository.findById(gameId).switchIfEmpty(Mono.error(IllegalStateException("game not found"))))
            .flatMap { tuple ->
                val user = tuple.t1
                val game = tuple.t2
                teamsOf(user).map { teams ->
                    check(teams.any { it.id == teamId }) { "that team isn't one of this user's teams" }
                    check(game.homeTeam?.id == teamId || game.awayTeam?.id == teamId) { "that team isn't playing in that game" }
                    PickContext(user, user.toUserDTO(), Team().apply { id = teamId }, game)
                }
            }

    private fun loadUser(userId: Long): Mono<User> =
        userRepository.findOneById(userId).switchIfEmpty(Mono.error(IllegalStateException("user not found")))

    // Kids don't choose teams; they play for their parent's teams
    private fun teamsOf(user: User): Mono<List<Team>> {
        val parentId = user.parent?.id
        return if (!user.teams.isNullOrEmpty() || parentId == null) {
            Mono.just(user.teams.orEmpty())
        } else {
            userRepository.findOneById(parentId).map { it.teams.orEmpty() }.defaultIfEmpty(emptyList())
        }
    }

    private fun checkCooldown(ctx: PickContext, pick: String): Mono<Void> {
        val game = ctx.game
        val teamId = ctx.team.id!!
        return Flux.concat(
            gameRepository.findTwoPreviousGameIds(game.season!!, teamId, game.date!!),
            gameRepository.findTwoNextGameIds(game.season!!, teamId, game.date!!)
        )
            .concatMap { id ->
                pickRepository.findByGameAndUserAndTeam(Game().apply { this.id = id }, ctx.userDTO, ctx.team)
                    .map { neighbor -> id to neighbor }
            }
            .filter { (_, neighbor) ->
                when (pick) {
                    "goalies" -> neighbor.goalies == true
                    "team" -> neighbor.theTeam == true
                    else -> neighbor.gamePlayer?.name == pick
                }
            }
            .next()
            .flatMap { (conflictGameId, _) ->
                Mono.error<Void>(
                    IllegalStateException(
                        "Not a legal pick: they also picked $pick in game $conflictGameId, " +
                            "and picks have a two-game cooldown."
                    )
                )
            }
    }

    // Only games that have started have stats; scoring an unplayed game would give goalies a "shutout"
    private fun recalculatePoints(game: Game): Mono<Void> =
        if (game.gameState.equals("Preview", ignoreCase = true)) {
            Mono.empty()
        } else {
            gameStateSyncer.updatePoints(game).then()
        }

    private fun describe(pick: Pick): String = when {
        pick.goalies == true -> "goalies"
        pick.theTeam == true -> "team"
        else -> pick.gamePlayer?.name ?: "player ${pick.gamePlayer?.id?.playerId}"
    }
}
