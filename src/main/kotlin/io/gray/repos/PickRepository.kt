package io.gray.repos

import io.gray.model.*
import io.micronaut.data.annotation.Join
import io.micronaut.data.annotation.Query
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface PickRepository : ReactorCrudRepository<Pick, Long> {
    @Join("user", type = Join.Type.LEFT_FETCH)
    @Join("announcer", type = Join.Type.LEFT_FETCH)
    @Join("team", type = Join.Type.FETCH)
    fun findAllByTeamAndGameIdBetween(team: Team, lower: Int, upper: Int): Flux<Pick>

    @Join("user", type = Join.Type.FETCH)
    @Join("team", type = Join.Type.FETCH)
    fun findAllByTeamInAndUserInAndGameIdBetween(teams: List<Team>, users: List<UserDTO>, lower: Int, upper: Int): Flux<Pick>

    @Join("user", type = Join.Type.FETCH)
    @Join("team", type = Join.Type.FETCH)
    fun findAllByTeamInAndGameIdBetweenAndUserRedditUsernameIsNotEmpty(teams: List<Team>, lower: Int, upper: Int): Flux<Pick>

    @Query("SELECT MIN(display_name) as display_name, MIN(email) as email, COUNT(*) AS games, SUM(points) as points, team_id as team_id FROM pick JOIN \"user\" ON pick.user_id = \"user\".id WHERE game_id > :gameIdLower AND game_id < :gameIdUpper AND team_id IN(:teams) AND user_id IS NOT NULL GROUP BY user_id, team_id")
    fun getLeaderboardForUsersByGameIdAndTeam(gameIdLower: Int, gameIdUpper: Int, teams: List<Long>): Flux<Leaderboard>

    @Query("SELECT MIN(reddit_username) as display_name, MIN(email) as email, COUNT(*) AS games, SUM(points) as points, team_id as team_id FROM pick JOIN \"user\" ON pick.user_id = \"user\".id WHERE game_id > :gameIdLower AND game_id < :gameIdUpper AND team_id IN(:teams) AND reddit_username IS NOT NULL GROUP BY reddit_username, team_id")
    fun getRedditLeaderboardForUsersByGameIdAndTeam(gameIdLower: Int, gameIdUpper: Int, teams: List<Long>): Flux<Leaderboard>

    @Query("SELECT MIN(display_name) as display_name, MIN(email) as email, COUNT(*) AS games, SUM(points) as points, team_id as team_id FROM pick JOIN \"user\" ON pick.user_id = \"user\".id WHERE game_id > :gameIdLower AND game_id < :gameIdUpper AND team_id IN(:teams) AND user_id IN(:users) GROUP BY user_id, team_id")
    fun getLeaderboardForUsersByGameIdAndTeamAndUserIdIn(gameIdLower: Int, gameIdUpper: Int, teams: List<Long>, users: List<Long>): Flux<Leaderboard>
    @Query("SELECT MIN(display_name) as display_name, '' as email, COUNT(*) AS games, SUM(points) as points, pick.team_id as team_id FROM pick JOIN announcer ON pick.announcer_id = announcer.id WHERE game_id > :gameIdLower AND game_id < :gameIdUpper AND pick.team_id IN(:teams) AND announcer_id IS NOT NULL GROUP BY announcer_id, pick.team_id")
    fun getLeaderboardForAnnouncersByGameIdAndTeam(gameIdLower: Int, gameIdUpper: Int, teams: List<Long>): Flux<Leaderboard>

    fun deleteByGame(aGame: Game): Mono<Long>

    @Join("user", type = Join.Type.LEFT_FETCH)
    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    fun findAllByUserAndGameIdBetween(aUser: UserDTO, lower: Int, upper: Int): Flux<Pick>

    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    @Join("announcer", type = Join.Type.LEFT_FETCH)
    fun findAllByAnnouncerAndGameIdBetween(aAnnouncer: Announcer, lower: Int, upper: Int): Flux<Pick>

    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    fun findByGameAndUserAndTeam(aGame: Game, aUser: UserDTO, aTeam: Team): Mono<Pick>

    fun findByGameAndAnnouncer(aGame: Game, aAnnouncer: Announcer): Mono<Pick>

    @Query("UPDATE pick SET points = :points where game_player_id_game_id = :gameId and game_player_id_player_id = :playerId")
    fun updatePointsForGamePlayer(points: Short, gameId: Long, playerId: Long): Mono<Int>

    @Query("UPDATE pick SET points = :points where game_id = :gameId and team_id = :teamId and the_team = True")
    fun updatePointsForTheTeam(points: Short, gameId: Long, teamId: Long): Mono<Int>

    @Query("UPDATE pick SET points = :points where game_id = :gameId and team_id = :teamId and goalies = True")
    fun updatePointsForGoalies(points: Short, gameId: Long, teamId: Long): Mono<Int>

}