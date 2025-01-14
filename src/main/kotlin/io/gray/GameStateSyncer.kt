package io.gray

import io.gray.client.*
import io.gray.client.model.Boxscore
import io.gray.client.model.GameState
import io.gray.model.*
import io.gray.repos.GamePlayerRepository
import io.gray.repos.GameRepository
import io.gray.repos.PickRepository
import io.gray.repos.TeamRepository
import io.micronaut.scheduling.TaskExecutors
import io.micronaut.scheduling.annotation.ExecuteOn
import io.micronaut.scheduling.annotation.Scheduled
import io.micronaut.transaction.TransactionDefinition
import io.micronaut.transaction.annotation.Transactional
import jakarta.inject.Singleton
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Singleton
open class GameStateSyncer(
        private val teamRepository: TeamRepository,
        private val gameRepository: GameRepository,
        private val gamePlayerRepository: GamePlayerRepository,
        private val pickRepository: PickRepository,
        private val scheduleClient: ScheduleClient,
        private val franchiseClient: FranchiseClient,
        private val rosterClient: RosterClient,
        private val boxScoreClient: BoxScoreClient,
        private val scoreClient: ScoreClient,
) {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    //@Scheduled(fixedDelay = "1m", initialDelay = "\${game.sync.delay:0s}")
    @ExecuteOn(TaskExecutors.IO)
    fun syncInProgressGameState() {
        syncAllGames(LocalDateTime.now().minute)
    }

    fun syncAllGames(minuteOfHour: Int) {
        scheduleClient.getSchedule(LocalDate.now().minusDays(2).toString())
                .flatMapIterable { it.gameWeek }
                .flatMap { gameDay ->
                    scoreClient.getScore(gameDay.date).map { score -> gameDay.apply { this.score = score } }
                }
                .flatMapIterable { it.games.forEach { game -> game.goals = it.score?.games?.firstOrNull { scoreGame -> scoreGame.id == game.id }?.goals }; it.games; }
                .filter { LocalDateTime.now().plusDays(1).plusHours(2).isAfter(LocalDateTime.parse(it.startTimeUTC, DateTimeFormatter.ISO_DATE_TIME)) }
                .flatMap { game ->
                    teamRepository.findById(game.awayTeam.id).switchIfEmpty(Mono.defer { createTeam(game.awayTeam) }).map { game.apply { this.awayTeam.dbTeam = it } }
                }
                .flatMap { game ->
                    teamRepository.findById(game.homeTeam.id).switchIfEmpty(Mono.defer { createTeam(game.homeTeam) }).map { game.apply { this.homeTeam.dbTeam = it } }
                }
                .flatMap { game ->
                    logger.info("processing game ${game.id} with state ${game.gameState} on date ${game.startTimeUTC} between team ${game.homeTeam.placeName.default} and ${game.awayTeam.placeName.default}")
                    gameRepository.findById(game.id).switchIfEmpty(
                            Mono.defer { createGame(game) }
                    ).flatMap {
                        if (LocalDateTime.parse(game.startTimeUTC, DateTimeFormatter.ISO_DATE_TIME) != it.date) {
                            logger.info("rescheduling game ${game.id} from date ${it.date} to ${game.startTimeUTC}")
                            gameRepository.update(it.apply { it.date = LocalDateTime.parse(game.startTimeUTC, DateTimeFormatter.ISO_DATE_TIME) }).thenReturn(it)
                        } else {
                            Mono.just(it)
                        }
                    }.flatMap {
                        if (minuteOfHour % 5 == 0 && it.gameState.equals("preview", ignoreCase = true)) {
                            logger.info("checking for missing players for game ${game.id}")
                            addMissingPlayers(it, game).then(gameRepository.findById(game.id))
                        } else {
                            Mono.just(it)
                        }
                    }.map { Pair(it, game) }
                }
                .filter {
                    mapNewStateToOldState(it.second.gameState) == "Live" ||
                            (minuteOfHour % 5 == 0 && mapNewStateToOldState(it.second.gameState) == "Final")
                }
                .flatMap { pair ->
                    boxScoreClient.getBoxscore(pair.second.id.toString()).map { Triple(pair.first, pair.second, it) }
                }
                .flatMap { (dbGame, game, gameScore) ->
                    updateGamePlayersAndGame(dbGame, gameScore, game)
                }.flatMap { pDbGame ->
                    updatePoints(pDbGame)
                }
                .collectList().block()
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun addMissingPlayers(dbGame: Game, game: io.gray.client.model.Game): Mono<Game> {
        val dbGamePlayerIds = dbGame.players?.mapNotNull { it.id?.playerId }?.toSet() ?: emptySet()
        return getPlayers(game, game.homeTeam).mergeWith(getPlayers(game, game.awayTeam)).flatMap { player ->
            if (!dbGamePlayerIds.contains(player.id?.playerId)) {
                logger.info("making missing player ${player.name} for game ${game.id}")
                gamePlayerRepository.save(player)
            } else {
                Mono.empty()
            }
        }.then(Mono.just(dbGame))
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updatePointsForGamePlayer(gamePlayer: GamePlayer): Mono<Int> {
        val points = when (gamePlayer.position) {
            "Forward" -> {
                (((gamePlayer.goals ?: 0) * 2) +
                        ((gamePlayer.otGoals ?: 0) * 5) +
                        ((gamePlayer.otShortGoals ?: 0) * 10) +
                        ((gamePlayer.shortGoals ?: 0) * 4) +
                        (gamePlayer.assists ?: 0) +
                        ((gamePlayer.shortAssists ?: 0) * 2)).toShort()
            }

            "Defenseman" -> {
                (((gamePlayer.goals ?: 0) * 3) +
                        ((gamePlayer.otGoals ?: 0) * 5) +
                        ((gamePlayer.otShortGoals ?: 0) * 10) +
                        ((gamePlayer.shortGoals ?: 0) * 6) +
                        (gamePlayer.assists ?: 0) +
                        ((gamePlayer.shortAssists ?: 0) * 2)).toShort()
            }

            else -> {
                return Mono.empty()
            }
        }
        return pickRepository.updatePointsForGamePlayer(points, gamePlayer.id!!.gameId, gamePlayer.id!!.playerId)
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updatePointsForTeam(team: Team, goals: Short, goalsAgainst: Short, game: Game, goalieAssists: Short): Flux<Int> {
        val goaliePoints: Short = when (goalsAgainst.toInt()) {
            0 -> {
                5
            }

            1, 2 -> {
                3
            }

            else -> {
                0
            }
        }.plus(goalieAssists * 5).toShort()
        var actualGoals = goals
        if (game.isShootout == true && goals > goalsAgainst) {
            actualGoals--
        }
        var teamPoints = if (actualGoals >= 4) {
            actualGoals
        } else {
            0
        }
        return Flux.concat(pickRepository.updatePointsForGoalies(goaliePoints, game.id!!, team.id!!), pickRepository.updatePointsForTheTeam(teamPoints, game.id!!, team.id!!))
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updatePoints(dbGame: Game): Flux<Int> {
        logger.info("updating points for game ${dbGame.id}")
        var flux = Flux.empty<Int>()
        dbGame.players?.forEach {
            flux = Flux.concat(flux, updatePointsForGamePlayer(it))
        }
        dbGame.homeTeam?.let {
            flux = Flux.concat(flux, updatePointsForTeam(it, dbGame.homeTeamGoals ?: 0, dbGame.awayTeamGoals
                    ?: 0, dbGame, dbGame.homeTeamGoalieAssists ?: 0))
        }
        dbGame.awayTeam?.let {
            flux = Flux.concat(flux, updatePointsForTeam(it, dbGame.awayTeamGoals ?: 0, dbGame.homeTeamGoals
                    ?: 0, dbGame, dbGame.awayTeamGoalieAssists ?: 0))
        }
        return flux
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun createTeam(team: io.gray.client.model.Team): Mono<Team> {
        logger.info("creating team ${team.placeName} ${team.abbrev}")
        return franchiseClient.getFranchises().flatMapIterable { it.data }.filter {
            it.teamPlaceName == team.placeName.default && it.lastSeason == null
        }.next().flatMap { franchise ->
            teamRepository.save(Team().also {
                it.id = team.id
                it.teamName = franchise.fullName
                it.abbreviation = team.abbrev
                it.shortName = franchise.teamCommonName
            }).onErrorResume { _ -> teamRepository.findById(team.id).switchIfEmpty(Mono.error { error("had all sorts of problems making a team") }) }
        }
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updateGamePlayersAndGame(dbGame: Game, gameScore: Boxscore, game: io.gray.client.model.Game): Mono<Game> {
        logger.info("updating game ${game.id} with status ${dbGame.gameState} on date ${dbGame.date} between team ${game.homeTeam.dbTeam.teamName} and ${game.awayTeam.dbTeam.teamName}")
        val allPlayers = gameScore.playerByGameStats.awayTeam.defense
                .plus(gameScore.playerByGameStats.awayTeam.forwards)
                .plus(gameScore.playerByGameStats.homeTeam.defense)
                .plus(gameScore.playerByGameStats.homeTeam.forwards).associateBy { it.playerId }
        val goalsByPlayer = game.goals?.groupBy { it.playerId }
        val assistsByPlayer = game.goals?.flatMap { goal -> goal.assists.map { i -> goal to i.playerId } }
                                    ?.groupBy({ (_, player) -> player }, valueTransform = { (goal, _) -> goal })
        val playerFlux = Flux.fromIterable(dbGame.players?.associateBy { dbPlayer ->
            allPlayers[dbPlayer.id?.playerId!!]
        }?.mapValues { (player, dbPlayer) ->
            val playerGoals = goalsByPlayer?.get(player?.playerId)
            val playerAssists = assistsByPlayer?.get(player?.playerId)
            val otShortGoals = playerGoals?.count { goal -> goal.periodDescriptor.periodType == "OT" && goal.strength == "sh" } ?: 0
            val otGoals = playerGoals?.count { goal -> goal.periodDescriptor.periodType == "OT" && goal.strength != "sh" } ?: 0
            val shortGoals = playerGoals?.count { goal -> goal.periodDescriptor.periodType != "OT" && goal.strength == "sh" } ?: 0
            val shortAssists = playerAssists?.count { goal -> goal.strength == "sh" } ?: 0
            val goals = playerGoals?.count { goal -> goal.periodDescriptor.periodType != "OT" && goal.strength != "sh" } ?: 0
            val assists = playerAssists?.count { goal -> goal.strength != "sh" } ?: 0
            dbPlayer.timeOnIce = player?.toi ?: "0:00"
            dbPlayer.goals = goals.toShort()
            dbPlayer.assists = assists.toShort()
            dbPlayer.shortGoals = shortGoals.toShort()
            dbPlayer.shortAssists = shortAssists.toShort()
            dbPlayer.otGoals = otGoals.toShort()
            dbPlayer.otShortGoals = otShortGoals.toShort()
            dbPlayer
        }?.mapNotNull { it.value } ?: emptyList()).flatMap { gamePlayerRepository.update(it) }
        dbGame.gameState = mapNewStateToOldState(game.gameState)
        dbGame.awayTeamGoals = gameScore.awayTeam.score
        dbGame.homeTeamGoals = gameScore.homeTeam.score
        dbGame.isShootout = game.periodDescriptor?.periodType == "SO"
        val awayTeamGoalIds = gameScore.playerByGameStats.awayTeam.goalies.map { it.playerId }
        dbGame.awayTeamGoalieAssists = game.goals?.count { goal -> goal.assists.any { assist -> assist.playerId in awayTeamGoalIds } }?.toShort()
                ?: dbGame.awayTeamGoalieAssists
        val homeTeamGoalIds = gameScore.playerByGameStats.homeTeam.goalies.map { it.playerId }
        dbGame.homeTeamGoalieAssists = game.goals?.count { goal -> goal.assists.any { assist -> assist.playerId in homeTeamGoalIds } }?.toShort()
                ?: dbGame.homeTeamGoalieAssists
        return playerFlux.collectList().then(gameRepository.update(dbGame))
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun createGame(game: io.gray.client.model.Game): Mono<Game> {
        logger.info("creating game ${game.id} on date ${game.startTimeUTC} between team ${game.homeTeam.dbTeam.teamName} and ${game.awayTeam.dbTeam.teamName}")
        return getPlayers(game, game.awayTeam).collectList().zipWith(getPlayers(game, game.homeTeam).collectList()).flatMap { players ->
            gameRepository.save(Game().also {
                it.id = game.id
                it.gameState = mapNewStateToOldState(game.gameState)
                it.awayTeam = game.awayTeam.dbTeam
                it.homeTeam = game.homeTeam.dbTeam
                it.date = LocalDateTime.parse(game.startTimeUTC, DateTimeFormatter.ISO_DATE_TIME)
                it.players = players.t1.plus(players.t2)
                it.league = League.NHL
            })
        }
    }


    private fun getPlayers(game: io.gray.client.model.Game, team: io.gray.client.model.Team): Flux<GamePlayer> {
        return rosterClient.getRoster(team.abbrev, game.season.toString()).flatMapIterable {
            it.goalies.plus(it.defensemen).plus(it.forwards)
        }
                .map { rosterEntry ->
                    GamePlayer().also {
                        it.id = GamePlayerId(game.id, rosterEntry.id)
                        it.name = rosterEntry.firstName.default + " " + rosterEntry.lastName.default
                        it.position = when (rosterEntry.positionCode) {
                            'R', 'L', 'C' -> "Forward"
                            'G' -> "Goalie"
                            'D' -> "Defenseman"
                            else -> error("unknown position code ${rosterEntry.positionCode}")
                        }
                        it.team = team.dbTeam
                    }
                }
    }

    private fun mapNewStateToOldState(gameState: GameState) = when (gameState) {
        GameState.OFF, GameState.FINAL -> "Final"
        GameState.LIVE, GameState.CRIT -> "Live"
        GameState.FUT, GameState.PRE -> "Preview"
    }

}