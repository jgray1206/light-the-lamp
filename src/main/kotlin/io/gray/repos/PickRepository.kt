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