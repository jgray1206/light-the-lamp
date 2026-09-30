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

    fun findTop2ByDateLessThanAndSeasonAndHomeTeamOrAwayTeamOrderByIdDesc(
        date: LocalDateTime,
        season: String,
        homeTeam: Team,
        awayTeam: Team
    ): Flux<Game>


    @Join("homeTeam", type = Join.Type.FETCH)
    @Join("awayTeam", type = Join.Type.FETCH)
    @Join("players", type = Join.Type.LEFT_FETCH)
    fun findByIdIn(ids: List<Long>): Flux<Game>

    @Query("select id from game where (home_team_id = :homeTeamId OR away_team_id = :awayTeamId) and season = :season order by id desc limit :top")
    fun findTopByHomeTeamOrAwayTeamAndSeasonOrderByIdDesc(
        homeTeamId: Long,
        awayTeamId: Long,
        season: String,
        top: Int
    ): Flux<Long>

    @Join("homeTeam", type = Join.Type.FETCH)
    @Join("awayTeam", type = Join.Type.FETCH)
    fun findByDateGreaterThanEqualsAndDateLessThan(
        greaterThan: LocalDateTime,
        lessThanEquals: LocalDateTime
    ): Flux<Game>

    // A team's games right before / after a date, for the two-game pick cooldown
    @Query("select id from game where season = :season and (home_team_id = :teamId or away_team_id = :teamId) and date < :date order by date desc limit 2")
    fun findTwoPreviousGameIds(season: String, teamId: Long, date: LocalDateTime): Flux<Long>

    @Query("select id from game where season = :season and (home_team_id = :teamId or away_team_id = :teamId) and date > :date order by date asc limit 2")
    fun findTwoNextGameIds(season: String, teamId: Long, date: LocalDateTime): Flux<Long>

    @Query("select distinct season from game where season is not null order by season desc")
    fun findAllSeasons(): Flux<String>

    // The season of the most recently started game, i.e. the season currently being played
    @Query("select season from game where season is not null and date <= :now order by date desc limit 1")
    fun findLatestStartedSeason(now: LocalDateTime): Mono<String>
}
