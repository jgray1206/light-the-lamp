package io.gray.repos

import io.gray.model.Game
import io.gray.model.Team
import io.micronaut.data.annotation.Join
import io.micronaut.data.annotation.Query
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface GameRepository : ReactorCrudRepository<Game, Long> {
    @Join("homeTeam", type = Join.Type.FETCH)
    @Join("awayTeam", type = Join.Type.FETCH)
    @Join("players", type = Join.Type.LEFT_FETCH)
    override fun findById(aLong: Long): Mono<Game>

    @Join("homeTeam", type = Join.Type.FETCH)
    @Join("awayTeam", type = Join.Type.FETCH)
    @Join("players", type = Join.Type.LEFT_FETCH)
    fun findByHomeTeamOrAwayTeam(homeTeam: Team, awayTeam: Team): Flux<Game>

    fun findTop2ByIdLessThanAndIdGreaterThanEqualsAndHomeTeamOrAwayTeamOrderByIdDesc(lessThan: Long, greatThan: Long, homeTeam: Team, awayTeam: Team): Flux<Game>


    @Join("homeTeam", alias = "game_home_team_")
    @Join("awayTeam", alias = "game_away_team_")
    @Join("players", alias = "game_players_")
    @Query("SELECT game_.\"id\"," +
            "game_.\"date\"," +
            "game_.\"game_state\"," +
            "game_.\"is_shootout\"," +
            "game_.\"home_team_id\"," +
            "game_.\"home_team_goals\"," +
            "game_.\"home_team_goalie_assists\"," +
            "game_.\"away_team_id\"," +
            "game_.\"away_team_goals\"," +
            "game_.\"away_team_goalie_assists\"," +
            "game_away_team_.\"team_name\" AS game_away_team_team_name," +
            "game_away_team_.\"abbreviation\" AS game_away_team_abbreviation," +
            "game_away_team_.\"short_name\" AS game_away_team_short_name," +
            "game_home_team_.\"abbreviation\" AS game_home_team_abbreviation," +
            "game_home_team_.\"short_name\" AS game_home_team_short_name," +
            "game_home_team_.\"team_name\" AS game_home_team_team_name," +
            "game_players_.\"id_game_id\" AS game_players_id_game_id," +
            "game_players_.\"id_player_id\" AS game_players_id_player_id," +
            "game_players_.\"team_id\" AS game_players_team_id," +
            "game_players_.\"name\" AS game_players_name," +
            "game_players_.\"position\" AS game_players_position," +
            "game_players_.\"goals\" AS game_players_goals," +
            "game_players_.\"assists\" AS game_players_assists," +
            "game_players_.\"short_goals\" AS game_players_short_goals," +
            "game_players_.\"short_assists\" AS game_players_short_assists," +
            "game_players_.\"ot_goals\" AS game_players_ot_goals," +
            "game_players_.\"ot_short_goals\" AS game_players_ot_short_goals," +
            "game_players_.\"time_on_ice\" AS game_players_time_on_ice " +
        "FROM \"game\" game_ " +
            "LEFT JOIN \"game_player\" game_players_ ON game_.\"id\"=game_players_.\"id_game_id\" " +
            "INNER JOIN \"team\" game_away_team_ ON game_.\"away_team_id\"=game_away_team_.\"id\" " +
            "INNER JOIN \"team\" game_home_team_ ON game_.\"home_team_id\"=game_home_team_.\"id\" " +
        "WHERE ((game_.\"home_team_id\" = :homeTeam OR game_.\"away_team_id\" = :awayTeam) " +
            "AND (game_.\"id\" >= :lower AND game_.\"id\" <= :upper)) " +
            "AND game_.\"id\" IN (" +
                "SELECT game_.\"id\" " +
                "FROM \"game\" game_ " +
                "INNER JOIN \"team\" game_away_team_ ON game_.\"away_team_id\"=game_away_team_.\"id\" " +
                "INNER JOIN \"team\" game_home_team_ ON game_.\"home_team_id\"=game_home_team_.\"id\" " +
                "WHERE (game_.\"home_team_id\" = :homeTeam OR game_.\"away_team_id\" = :awayTeam) " +
                    "AND (game_.\"id\" >= :lower AND game_.\"id\" <= :upper) ORDER BY game_.\"id\" DESC LIMIT :maxGames)")
    fun findByHomeTeamOrAwayTeamAndIdBetween(homeTeam: Team, awayTeam: Team, lower: Int, upper: Int, maxGames: Int): Flux<Game>

}