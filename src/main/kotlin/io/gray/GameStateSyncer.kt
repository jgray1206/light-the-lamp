package io.gray

import io.gray.model.*
import io.gray.nhl.api.GamesApi
import io.gray.nhl.api.ScheduleApi
import io.gray.nhl.api.TeamsApi
import io.gray.nhl.model.GameBoxscore
import io.gray.nhl.model.ScheduleGame
import io.gray.repos.*
import io.micronaut.scheduling.TaskExecutors
import io.micronaut.scheduling.annotation.ExecuteOn
import io.micronaut.scheduling.annotation.Scheduled
import io.micronaut.transaction.TransactionDefinition
import io.micronaut.transaction.annotation.TransactionalAdvice
import jakarta.inject.Singleton
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Singleton
open class GameStateSyncer(
        private val teamsApi: TeamsApi,
        private val scheduleApi: ScheduleApi,
        private val gamesApi: GamesApi,
        private val teamRepository: TeamRepository,
        private val gameRepository: GameRepository,
        private val gamePlayerRepository: GamePlayerRepository,
        private val pickRepository: PickRepository
) {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    @Scheduled(fixedDelay = "1m")
    @ExecuteOn(TaskExecutors.IO)
    fun syncInProgressGameState() {
        syncAllGamesWithStatus("live")
        if (LocalDateTime.now().minute % 5 == 0) {
            syncAllGamesWithStatus("final")
        }
    }

    fun syncAllGamesWithStatus(status: String) {
        teamsApi.getTeams(null, null).flatMapIterable {
            it?.teams ?: listOf()
        }.filter { it.id != null }
                .flatMap { team ->
                    teamRepository.findById(team.id!!.toLong()).switchIfEmpty(createTeam(team))
                }
                .flatMap { team ->
                    scheduleApi.getSchedule(null, team.id!!.toString(), LocalDate.now().minusDays(2), LocalDateTime.now().plusHours(3).toLocalDate())
                }
                .flatMapIterable { it.dates }
                .flatMapIterable { it.games }
                .filter { it.gamePk != null }
                .groupBy { it.gamePk }
                .flatMap { g -> g.reduce { a, _ -> a } } //todo probably should store two games per gamePk
                .flatMap { game ->
                    //val futureGames = gameRepository.findAllByGameStateNotEqualAndDateGreaterThan("Final", LocalDate.now().minusDays(3).atStartOfDay()).collectList().block()

                    //reschedule logic
                    //futureGames?.forEach { futureGame ->
                    //    if (schedule?.dates?.isNotEmpty() == true && schedule.dates?.none { it?.games?.none { game -> game?.gamePk?.toLong() == futureGame.id } == true } == true) {
                    //        logger.warn("game id ${futureGame.id} on date ${futureGame.date} between ${futureGame.homeTeam?.teamName} and ${futureGame.awayTeam?.teamName} rescheduled, deleting game and picks")
                    //        deleteGameAndPicks(futureGame)
                    //    }
                    //}

                    gameRepository.findById(game.gamePk!!.toLong()).switchIfEmpty(
                            createGame(game)
                    ).map { Pair(it, game) }
                }
                .filter { it.second.status?.abstractGameState.equals(status, ignoreCase = true) }
                .flatMap { pair ->
                    gamesApi.getGameBoxscore(pair.second.gamePk!!).map { Pair(pair, it) }
                }
                .flatMap { gameScorePair ->
                    val game = gameScorePair.first.second
                    val dbGame = gameScorePair.first.first
                    val gameScore = gameScorePair.second
                    makePlayersIfNecessary(dbGame, game).then(gameRepository.findById(dbGame.id!!)).flatMap {
                        updateGamePlayersAndGame(it, gameScore, game)
                    }
                }.flatMap { pDbGame ->
                    updatePoints(pDbGame)
                }
                .collectList().block()
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun makePlayersIfNecessary(dbGame: Game, game: ScheduleGame): Mono<Game> {
        val dbGamePlayerIds = dbGame.players?.mapNotNull { it.id?.playerId }?.toSet() ?: emptySet()
        return teamRepository.findById(game.teams?.home?.team?.id?.toLong()!!)
                .zipWith(teamRepository.findById(game.teams?.away?.team?.id?.toLong()!!))
                .flatMap { tuple ->
                    getPlayers(game, tuple.t1).mergeWith(getPlayers(game, tuple.t2)).flatMap { player ->
                        if (!dbGamePlayerIds.contains(player.id?.playerId)) {
                            logger.info("making missing player ${player.name} for game ${game.gamePk}")
                            gamePlayerRepository.save(player)
                        } else {
                            Mono.empty()
                        }
                    }.then(Mono.just(dbGame))
                }
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updatePoints(dbGame: Game): Flux<Pick> {
        logger.info("updating points for game ${dbGame.id}")
        return pickRepository.findAllByGame(dbGame).flatMap {
            if (it.gamePlayer != null) {
                if (it.gamePlayer?.position == "Forward") {
                    it.points = (((it.gamePlayer?.goals ?: 0) * 2) +
                            ((it.gamePlayer?.shortGoals ?: 0) * 4) +
                            (it.gamePlayer?.assists ?: 0) +
                            ((it.gamePlayer?.shortAssists ?: 0) * 2)).toShort()
                } else if (it.gamePlayer?.position == "Defenseman") {
                    it.points = (((it.gamePlayer?.goals ?: 0) * 3) +
                            ((it.gamePlayer?.shortGoals ?: 0) * 6) +
                            (it.gamePlayer?.assists ?: 0) +
                            ((it.gamePlayer?.shortAssists ?: 0) * 2)).toShort()
                }
            } else if (it.goalies == true) {
                val goalsAgainst = if (dbGame.homeTeam?.id == it.team?.id!!) {
                    dbGame.awayTeamGoals!!
                } else {
                    dbGame.homeTeamGoals!!
                }
                it.points = when (goalsAgainst.toInt()) {
                    0 -> {
                        5
                    }

                    1, 2 -> {
                        3
                    }

                    else -> {
                        0
                    }
                }
            } else if (it.theTeam == true) {
                val teamGoals = if (dbGame.homeTeam?.id == it.team?.id!!) {
                    dbGame.homeTeamGoals!!
                } else {
                    dbGame.awayTeamGoals!!
                }
                it.points = if (teamGoals >= 4) {
                    teamGoals
                } else {
                    0
                }
            }
            pickRepository.update(it)
        }
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun createTeam(team: io.gray.nhl.model.Team): Mono<Team> {
        return teamRepository.save(Team().also {
            it.id = team.id!!.toLong()
            it.teamName = team.name
            it.abbreviation = team.abbreviation
            it.shortName = team.teamName
        })
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun deleteGameAndPicks(game: Game) {
        gameRepository.delete(game).block()
        pickRepository.deleteByGame(game).block()
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updateGamePlayersAndGame(dbGame: Game, gameScore: GameBoxscore, game: ScheduleGame): Mono<Game> {
        logger.info("updating game ${game.gamePk} with status ${game.status?.abstractGameState} on date ${game.gameDate} between team ${game.teams?.away?.team?.name} and ${game.teams?.home?.team?.name}")
        val playerFlux = Flux.fromIterable(dbGame.players?.associateBy { dbPlayer ->
            gameScore.teams?.away?.players?.get("ID" + dbPlayer.id?.playerId?.toString())
                    ?: gameScore.teams?.home?.players?.get("ID" + dbPlayer.id?.playerId?.toString())
        }?.mapValues { (player, dbPlayer) ->
            if (player?.stats?.skaterStats != null) {
                dbPlayer.timeOnIce = player.stats?.skaterStats?.timeOnIce
                dbPlayer.goals = player.stats?.skaterStats?.goals?.toShort()
                dbPlayer.assists = player.stats?.skaterStats?.assists?.toShort()
                dbPlayer.shortGoals = player.stats?.skaterStats?.shortHandedGoals?.toShort()
                dbPlayer.shortAssists = player.stats?.skaterStats?.shortHandedAssists?.toShort()
            } else if (player?.stats?.goalieStats != null) {
                dbPlayer.timeOnIce = player.stats?.goalieStats?.timeOnIce
                dbPlayer.goalsAgainst = ((player.stats?.goalieStats?.shots?.toInt()
                        ?: 0) - (player.stats?.goalieStats?.saves?.toInt() ?: 0)).toShort()
            }
            dbPlayer
        }?.mapNotNull { it.value } ?: emptyList()).flatMap { gamePlayerRepository.update(it) }
        dbGame.gameState = game.status?.abstractGameState
        dbGame.awayTeamGoals = gameScore.teams?.away?.teamStats?.teamSkaterStats?.goals?.toShort()
        dbGame.homeTeamGoals = gameScore.teams?.home?.teamStats?.teamSkaterStats?.goals?.toShort()
        return playerFlux.collectList().then(gameRepository.update(dbGame))
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun createGame(game: ScheduleGame): Mono<Game> {
        logger.info("creating game ${game.gamePk} on date ${game.gameDate} between team ${game.teams?.away?.team?.name} and ${game.teams?.home?.team?.name}")
        return teamRepository.findById(game.teams?.home?.team?.id?.toLong()!!)
                .zipWith(teamRepository.findById(game.teams?.away?.team?.id?.toLong()!!))
                .flatMap { tuple ->
                    getPlayers(game, tuple.t1).collectList().zipWith(getPlayers(game, tuple.t2).collectList()).flatMap { players ->
                        gameRepository.save(Game().also {
                            it.id = game.gamePk!!.toLong()
                            it.gameState = game.status?.abstractGameState
                            it.awayTeam = tuple.t2
                            it.homeTeam = tuple.t1
                            it.date = game.gameDate
                            it.players = players.t1.plus(players.t2)
                        })
                    }
                }
    }


    private fun getPlayers(game: ScheduleGame, team: Team): Flux<GamePlayer> {
        return teamsApi.getTeamRoster(BigDecimal.valueOf(team.id!!), null).flatMapIterable { it.roster }
                .map { rosterEntry ->
                    GamePlayer().also {
                        it.id = GamePlayerId(game.gamePk?.toLong()!!, rosterEntry.person?.id?.toLong()!!)
                        it.name = rosterEntry.person?.fullName
                        it.position = rosterEntry.position?.type
                        it.team = team
                    }
                }
    }

}