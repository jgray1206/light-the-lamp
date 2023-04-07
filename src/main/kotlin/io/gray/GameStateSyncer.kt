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
import org.slf4j.LoggerFactory
import java.math.BigDecimal
import java.time.LocalDate

@Singleton
open class GameStateSyncer(
        private val teamsApi: TeamsApi,
        private val scheduleApi: ScheduleApi,
        private val gamesApi: GamesApi,
        private val teamRepository: TeamRepository,
        private val gameRepository: GameRepository,
        private val gamePlayerRepository: GamePlayerRepository,
        private val userGroupRepository: UserGroupRepository,
        private val pickRepository: PickRepository
) {
    companion object {
        val logger = LoggerFactory.getLogger(this::class.java)
    }

    //to get pics
    //https://cms.nhl.bamgrid.com/images/headshots/current/168x168/8477968.jpg
    @Scheduled(fixedDelay = "3m")
    @ExecuteOn(TaskExecutors.IO)
    fun syncGameState() {
        val teams = teamsApi.getTeams(null, null).block()?.teams?.filter { it.id != null }
        val checkedGames = mutableSetOf<Long>()
        teams?.forEach { team ->
            val dbTeam = teamRepository.findById(team.id!!.toLong()).block()
            if (dbTeam?.id == null) {
                createTeam(team)
            }
        }
        teams?.forEach { team ->
            val schedule = scheduleApi.getSchedule(null, team.id!!.toString(), LocalDate.now().minusDays(3), LocalDate.now().plusDays(1)).block()
            //val futureGames = gameRepository.findAllByGameStateNotEqualAndDateGreaterThan("Final", LocalDate.now().minusDays(3).atStartOfDay()).collectList().block()

            //reschedule logic
            //futureGames?.forEach { futureGame ->
            //    if (schedule?.dates?.isNotEmpty() == true && schedule.dates?.none { it?.games?.none { game -> game?.gamePk?.toLong() == futureGame.id } == true } == true) {
            //        logger.warn("game id ${futureGame.id} on date ${futureGame.date} between ${futureGame.homeTeam?.teamName} and ${futureGame.awayTeam?.teamName} rescheduled, deleting game and picks")
            //        deleteGameAndPicks(futureGame)
            //    }
            //}

            schedule?.dates?.forEach dayLoop@{ day ->
                day.games?.forEach gameLoop@{ game ->
                    logger.info("refreshing db for game ${game.gamePk} on date ${game.gameDate} between team ${game.teams?.away?.team?.name} and ${game.teams?.home?.team?.name}")
                    if (game.gamePk == null) {
                        return@gameLoop
                    }
                    if (checkedGames.contains(game.gamePk!!.toLong())) {
                        logger.info("  already refreshed db game ${game.gamePk}, skipping..")
                        return@gameLoop
                    }

                    var dbGame = gameRepository.findById(game.gamePk!!.toLong()).block()
                    if (dbGame?.id == null) {
                        logger.info("  game did not exists, creating..")
                        dbGame = createGame(game)
                    }

                    if (game?.status?.abstractGameState != "Preview") {
                        logger.info("  game is finished, updating scores and picks..")
                        val gameScore = gamesApi.getGameBoxscore(game.gamePk!!).block()
                        dbGame = updateGamePlayersAndGame(dbGame, gameScore, game)
                        if (dbGame != null) {
                            updatePickPoints(dbGame)
                            updateUserGroupPoints(dbGame)
                        }
                    }
                    checkedGames.add(game.gamePk!!.toLong())
                }
            }
        }
    }

    private fun updateUserGroupPoints(dbGame: Game) {
        val picks = pickRepository.findAllByGame(dbGame).collectList().block()
        picks?.forEach { pick ->
            val allUserPicks = pickRepository.findAllByUser(pick.user!!).collectList().block() ?: return@forEach
            pick.group?.id?.let { groupId ->
                val userGroup = userGroupRepository.findByUserIdAndGroupId(pick.user?.id!!, groupId).block() ?: return@forEach
                userGroup.score = allUserPicks.sumOf { it.points?.toInt() ?: 0 }.toShort()
                userGroupRepository.save(userGroup).block()
            }
        }
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updatePickPoints(dbGame: Game) {
        val picks = pickRepository.findAllByGame(dbGame).collectList().block()
        picks?.forEach {
            if (it.gamePlayer != null) {
                if (it.gamePlayer?.position == "Forward") {
                    it.points = ((it.gamePlayer?.goals ?: 0) + (it.gamePlayer?.assists ?: 0)).toShort()
                } else if (it.gamePlayer?.position == "Defenseman") {
                    it.points = ((it.gamePlayer?.goals ?: 0) * 2 + (it.gamePlayer?.assists ?: 0)).toShort()
                }
            } else if (it.goalies == true) {
                val teamId = it.group?.team?.id ?: it.user?.team?.id
                dbGame.players?.filter {
                    it.team?.id == teamId && it.position == "Goalie"
                }?.sumOf { it.goalsAgainst?.toInt() ?: 0 }?.let { goalsAgainst ->
                    it.points = when (goalsAgainst) {
                        0 -> { 5 }
                        1 -> { 2 }
                        else -> { 0 }
                    }
                }
            } else if (it.team == true) {
                val teamId = it.group?.team?.id  ?: it.user?.team?.id
                val teamGoals = if (dbGame.homeTeam?.id == teamId) {
                    dbGame.homeTeamGoals!!
                } else {
                    dbGame.awayTeamGoals!!
                }
                it.points = if (teamGoals >= 6) {
                    5
                } else if (teamGoals >= 4) {
                    2
                } else {
                    0
                }
            }
            pickRepository.update(it).block()
        }
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun createTeam(team: io.gray.nhl.model.Team) {
        teamRepository.save(Team().also {
            it.id = team.id!!.toLong()
            it.teamName = team.name
        }).block()
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun deleteGameAndPicks(game: Game) {
        gameRepository.delete(game).block()
        pickRepository.deleteByGame(game).block()
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun updateGamePlayersAndGame(pDbGame: Game?, gameScore: GameBoxscore?, game: ScheduleGame): Game? {
        return pDbGame?.let { dbGame ->
            dbGame.players?.forEach { dbPlayer ->
                val player = gameScore?.teams?.away?.players?.get("ID" + dbPlayer.id?.playerId?.toString())
                        ?: gameScore?.teams?.home?.players?.get("ID" + dbPlayer.id?.playerId?.toString())
                player?.let {
                    if (player.stats?.skaterStats != null) {
                        dbPlayer.timeOnIce = player.stats?.skaterStats?.timeOnIce ?: return null
                        dbPlayer.goals = player.stats?.skaterStats?.goals?.toShort() ?: return null
                        dbPlayer.assists = player.stats?.skaterStats?.assists?.toShort() ?: return null
                        dbPlayer.shortGoals = player.stats?.skaterStats?.shortHandedGoals?.toShort() ?: return null
                        dbPlayer.shortAssists = player.stats?.skaterStats?.shortHandedAssists?.toShort() ?: return null
                    } else if (player.stats?.goalieStats != null) {
                        dbPlayer.timeOnIce = player.stats?.goalieStats?.timeOnIce ?: return null
                        dbPlayer.goalsAgainst = ((player.stats?.goalieStats?.shots?.toInt()
                                ?: return null) - (player.stats?.goalieStats?.saves?.toInt() ?: return null)).toShort()
                    }
                    gamePlayerRepository.update(dbPlayer).block()
                }
            }
            dbGame.gameState = game.status?.abstractGameState
            dbGame.awayTeamGoals = gameScore?.teams?.away?.teamStats?.teamSkaterStats?.goals?.toShort() ?: return null
            dbGame.homeTeamGoals = gameScore.teams?.home?.teamStats?.teamSkaterStats?.goals?.toShort() ?: return null
            gameRepository.update(dbGame).block()
        }
    }

    @TransactionalAdvice(value = "default", propagation = TransactionDefinition.Propagation.REQUIRES_NEW)
    open fun createGame(game: ScheduleGame): Game? {
        val homeTeam = teamRepository.findById(game.teams?.home?.team?.id?.toLong()!!).block()!!
        val awayTeam = teamRepository.findById(game.teams?.away?.team?.id?.toLong()!!).block()!!
        return gameRepository.save(Game().also {
            it.id = game.gamePk!!.toLong()
            it.gameState = game.status?.abstractGameState
            it.awayTeam = awayTeam
            it.homeTeam = homeTeam
            it.date = game.gameDate
            it.players = getPlayers(game, awayTeam).plus(getPlayers(game, homeTeam))
        }).block()
    }

    private fun getPlayers(game: ScheduleGame, team: Team): List<GamePlayer> {
        val roster = teamsApi.getTeamRoster(BigDecimal.valueOf(team.id!!), null).block()?.roster!!
        return roster.map { rosterEntry ->
            GamePlayer().also {
                it.id = GamePlayerId(game.gamePk?.toLong()!!, rosterEntry.person?.id?.toLong()!!)
                it.name = rosterEntry.person?.fullName
                it.position = rosterEntry.position?.type
                it.team = team
            }
        }
    }

}