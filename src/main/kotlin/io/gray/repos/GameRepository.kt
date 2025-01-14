package io.gray.repos

import io.gray.model.Game
import io.gray.model.Team
import io.micronaut.data.annotation.Join
import io.micronaut.data.annotation.Query
import io.micronaut.data.model.Page
import io.micronaut.data.model.Pageable
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

    fun findTop2ByIdLessThanAndSeasonAndHomeTeamOrAwayTeamOrderByIdDesc(lessThan: Long, season: String, homeTeam: Team, awayTeam: Team): Flux<Game>


    @Join("homeTeam", type = Join.Type.FETCH)
    @Join("awayTeam", type = Join.Type.FETCH)
    @Join("players", type = Join.Type.LEFT_FETCH)
    fun findByIdIn(ids: List<Long>): Flux<Game>

    fun findByHomeTeamOrAwayTeamAndSeasonOrderByIdDesc(homeTeam: Team, awayTeam: Team, season: String, pageable: Pageable): Mono<Page<Game>>

}