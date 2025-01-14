package io.gray

import com.fasterxml.jackson.databind.ObjectMapper
import io.gray.client.*
import io.gray.client.model.pwhl.GameSummaryResponse
import io.gray.client.model.pwhl.GameSummaryTeam
import io.gray.client.model.pwhl.RosterResponse
import io.gray.client.model.pwhl.ScheduledGame
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
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Singleton
open class PWHLGameStateSyncer(
    private val teamRepository: TeamRepository,
    private val gameRepository: GameRepository,
    private val gamePlayerRepository: GamePlayerRepository,
    private val pickRepository: PickRepository,
    private val pwhlClient: PWHLClient,
    private val objectMapper: ObjectMapper
) {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    @Scheduled(fixedDelay = "1m", initialDelay = "\${game.sync.delay:0s}")
    @ExecuteOn(TaskExecutors.IO)
    fun syncInProgressGameState() {
        syncAllGames(LocalDateTime.now().minute)
    }

    fun syncAllGames(minuteOfHour: Int) {
        pwhlClient.getGamesByDate("5", "2")
            .flatMapIterable { it.siteKit.scheduledGames }
            .filter {
                LocalDateTime.now().plusDays(1).plusHours(2)
                    .isAfter(LocalDateTime.parse(it.GameDateISO8601, DateTimeFormatter.ISO_DATE_TIME))
            }

            .flatMap { game ->
                pwhlClient.getGameSummary(game.ID)
                    .map { it.removeSurrounding("(", ")") }
                    .map { objectMapper.readValue(it, GameSummaryResponse::class.java) }
                    .map { game.apply { this.gameSummaryResponse = it } }
            }
            .flatMap { game ->
                teamRepository.findById(game.VisitorID.toLong() + 1000).switchIfEmpty(Mono.defer {
                    createTeam(
                        id = game.VisitorID.toLong() + 1000,
                        teamName = game.VisitorLongName,
                        abbreviation = game.VisitorCode,
                        shortName = game.VisitorNickname
                    )
                }).map { game.apply { this.awayTeam = it } }
            }
            .flatMap { game ->
                teamRepository.findById(game.HomeID.toLong() + 1000).switchIfEmpty(Mono.defer {
                    createTeam(
                        id = game.HomeID.toLong() + 1000,
                        teamName = game.HomeLongName,
                        abbreviation = game.HomeCode,
                        shortName = game.HomeNickname
                    )
                }).map { game.apply { this.homeTeam = it } }
            }
            .flatMap { game ->
                logger.info("processing game ${game.getGameId()} with state ${mapNewStateToOldState(game.GameStatus)} on date ${game.GameDateISO8601} between team ${game.homeTeam!!.shortName} and ${game.awayTeam!!.shortName}")
                gameRepository.findById(game.getGameId()).switchIfEmpty(
                    Mono.defer { createGame(game) }
                ).flatMap {
                    if (LocalDateTime.parse(game.GameDateISO8601, DateTimeFormatter.ISO_DATE_TIME) != it.date) {
                        logger.info("rescheduling game ${game.getGameId()} from date ${it.date} to ${game.GameDateISO8601}")
                        gameRepository.update(it.apply {
                            it.date = LocalDateTime.parse(game.GameDateISO8601, DateTimeFormatter.ISO_DATE_TIME)
                        }).thenReturn(it)
                    } else {
                        Mono.just(it)
                    }
                }.flatMap {
                    if (minuteOfHour % 5 == 0 && it.gameState.equals("preview", ignoreCase = true)) {
                        logger.info("checking for missing players for game ${game.getGameId()}")
                        addMissingPlayers(it, game).then(gameRepository.findById(game.getGameId()))
                    } else {
                        Mono.just(it)
                    }
                }.map { Pair(it, game) }
            }
            .filter {
                mapNewStateToOldState(it.second.GameStatus) == "Live" ||
                        (minuteOfHour % 5 == 0 && mapNewStateToOldState(it.second.GameStatus) == "Final")
            }
            .flatMap { (dbGame, game) ->
                updateGamePlayersAndGame(dbGame, game)
            }.flatMap { pDbGame ->
                updatePoints(pDbGame)
            }
            .collectList().block()
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun addMissingPlayers(dbGame: Game, game: ScheduledGame): Mono<Game> {
        val dbGamePlayerIds = dbGame.players?.mapNotNull { it.id?.playerId }?.toSet() ?: emptySet()
        return getPlayers(game, game.homeTeam!!).mergeWith(getPlayers(game, game.awayTeam!!)).flatMap { player ->
            if (!dbGamePlayerIds.contains(player.id?.playerId)) {
                logger.info("making missing player ${player.name} for game ${game.getGameId()}")
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
    open fun updatePointsForTeam(
        team: Team,
        goals: Short,
        goalsAgainst: Short,
        game: Game,
        goalieAssists: Short
    ): Flux<Int> {
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
        return Flux.concat(
            pickRepository.updatePointsForGoalies(goaliePoints, game.id!!, team.id!!),
            pickRepository.updatePointsForTheTeam(teamPoints, game.id!!, team.id!!)
        )
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updatePoints(dbGame: Game): Flux<Int> {
        logger.info("updating points for game ${dbGame.id}")
        var flux = Flux.empty<Int>()
        dbGame.players?.forEach {
            flux = Flux.concat(flux, updatePointsForGamePlayer(it))
        }
        dbGame.homeTeam?.let {
            flux = Flux.concat(
                flux, updatePointsForTeam(
                    it, dbGame.homeTeamGoals ?: 0, dbGame.awayTeamGoals
                        ?: 0, dbGame, dbGame.homeTeamGoalieAssists ?: 0
                )
            )
        }
        dbGame.awayTeam?.let {
            flux = Flux.concat(
                flux, updatePointsForTeam(
                    it, dbGame.awayTeamGoals ?: 0, dbGame.homeTeamGoals
                        ?: 0, dbGame, dbGame.awayTeamGoalieAssists ?: 0
                )
            )
        }
        return flux
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun createTeam(id: Long, teamName: String, abbreviation: String, shortName: String): Mono<Team> {
        logger.info("creating team ${teamName}")
        return teamRepository.save(Team().also {
            it.id = id
            it.teamName = teamName
            it.abbreviation = abbreviation
            it.shortName = shortName
        }).onErrorResume { _ ->
            teamRepository.findById(id).switchIfEmpty(Mono.error { error("had all sorts of problems making a team") })
        }
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updateGamePlayersAndGame(dbGame: Game, game: ScheduledGame): Mono<Game> {
        logger.info("updating game ${game.getGameId()} with status ${dbGame.gameState} on date ${dbGame.date} between team ${game.homeTeam!!.teamName} and ${game.awayTeam!!.teamName}")
        val allPlayers : Map<Long, GameSummaryTeam.Skater> = game.gameSummaryResponse!!.visitingTeam.skaters
            .plus(game.gameSummaryResponse!!.homeTeam.skaters).associateBy { it.info.id.toLong() }
        val goalsByPlayer = game.gameSummaryResponse?.periods?.flatMap { it.goals }?.groupBy { it.scoredBy.id }
        val assistsByPlayer = game.gameSummaryResponse?.periods?.flatMap { it.goals }
            ?.flatMap { goal -> goal.assists.map { i -> goal to i.id } }
            ?.groupBy({ (_, player) -> player }, valueTransform = { (goal, _) -> goal })
        val playerFlux = Flux.fromIterable(dbGame.players?.associateBy { dbPlayer ->
            allPlayers[dbPlayer.id?.playerId!!]
        }?.mapValues { (player, dbPlayer) ->
            val playerGoals = goalsByPlayer?.get(player?.info?.id)
            val playerAssists = assistsByPlayer?.get(player?.info?.id)
            val otShortGoals =
                playerGoals?.count { goal -> goal.period.shortName.startsWith("OT") && goal.properties.isShortHanded == "1" } ?: 0
            val otGoals =
                playerGoals?.count { goal -> goal.period.shortName.startsWith("OT") && goal.properties.isShortHanded == "0" } ?: 0
            val shortGoals =
                playerGoals?.count { goal -> !goal.period.shortName.startsWith("OT") &&  goal.properties.isShortHanded == "1" } ?: 0
            val shortAssists = playerAssists?.count { goal -> goal.properties.isShortHanded == "1" } ?: 0
            val goals =
                playerGoals?.count { goal -> !goal.period.shortName.startsWith("OT") && goal.properties.isShortHanded == "0" } ?: 0
            val assists = playerAssists?.count { goal -> goal.properties.isShortHanded == "0" } ?: 0
            dbPlayer.timeOnIce = player?.stats?.toi ?: "0:00"
            dbPlayer.goals = goals.toShort()
            dbPlayer.assists = assists.toShort()
            dbPlayer.shortGoals = shortGoals.toShort()
            dbPlayer.shortAssists = shortAssists.toShort()
            dbPlayer.otGoals = otGoals.toShort()
            dbPlayer.otShortGoals = otShortGoals.toShort()
            dbPlayer
        }?.mapNotNull { it.value } ?: emptyList()).flatMap { gamePlayerRepository.update(it) }
        dbGame.gameState = mapNewStateToOldState(game.GameStatus)
        dbGame.awayTeamGoals = game.VisitorGoals.toShort()
        dbGame.homeTeamGoals = game.HomeGoals.toShort()
        dbGame.isShootout = game.gameSummaryResponse?.hasShooutout
        dbGame.awayTeamGoalieAssists =
            game.gameSummaryResponse!!.visitingTeam.goalies.map { it.stats.assists }.sum().toShort()
        dbGame.homeTeamGoalieAssists =
            game.gameSummaryResponse!!.homeTeam.goalies.map { it.stats.assists }.sum().toShort()
        return playerFlux.collectList().then(gameRepository.update(dbGame))
    }

    @Transactional(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun createGame(game: ScheduledGame): Mono<Game> {
        logger.info("creating game ${game.SeasonID}${game.ID} on date ${game.GameDateISO8601} between team ${game.homeTeam!!.teamName} and ${game.awayTeam!!.teamName}")
        return getPlayers(game, game.awayTeam!!).collectList().zipWith(getPlayers(game, game.homeTeam!!).collectList())
            .flatMap { players ->
                gameRepository.save(Game().also {
                    it.id = game.getGameId()
                    it.gameState = mapNewStateToOldState(game.GameStatus)
                    it.awayTeam = game.awayTeam
                    it.homeTeam = game.homeTeam
                    it.date = LocalDateTime.parse(game.GameDateISO8601, DateTimeFormatter.ISO_DATE_TIME)
                    it.players = players.t1.plus(players.t2)
                    it.league = League.PWHL
                })
            }
    }


    private fun getPlayers(game: ScheduledGame, team: Team): Flux<GamePlayer> {
        return pwhlClient.getRoster((team.id!! - 1000).toString(), game.SeasonID).map { it.removeSurrounding("(", ")") }
            .map { objectMapper.readValue(it, RosterResponse::class.java) }
            .flatMapIterable { it.roster }
            .flatMapIterable { it.sections }
            .flatMapIterable { it.data }
            .map { it.row }
            .filter { it.playerId != null && it.position != null }
            .map { rosterEntry ->
                GamePlayer().also {
                    it.id = GamePlayerId(game.getGameId(), rosterEntry.playerId!!.toLong())
                    it.name = rosterEntry.name
                    it.position = when (rosterEntry.position!!) {
                        "RW", "LW", "C", "F" -> "Forward"
                        "G" -> "Goalie"
                        "D", "LD", "RD" -> "Defenseman"
                        else -> error("unknown position code ${rosterEntry.position}")
                    }
                    it.team = team
                }
            }
    }

    private fun mapNewStateToOldState(gameState: String) = when (gameState) {
        "4" -> "Final"
        "1" -> "Preview"
        else -> "Live"
    }

}