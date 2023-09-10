package io.gray.repos

import io.gray.model.Game
import io.gray.model.Pick
import io.gray.model.Team
import io.gray.model.User
import io.micronaut.data.annotation.Join
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface PickRepository : ReactorCrudRepository<Pick, Long> {
    @Join("user", type = Join.Type.FETCH)
    @Join("team", type = Join.Type.FETCH)
    fun findAllByTeamAndGameIdBetween(team: Team, lower: Int, upper: Int): Flux<Pick>

    @Join("user", type = Join.Type.FETCH)
    @Join("team", type = Join.Type.FETCH)
    fun findAllByTeamInAndUserInAndGameIdBetween(teams: List<Team>, users: List<User>, lower: Int, upper: Int): Flux<Pick>

    @Join("user", type = Join.Type.FETCH)
    @Join("team", type = Join.Type.FETCH)
    fun findAllByTeamInAndGameIdBetweenAndUserRedditUsernameIsNotEmpty(teams: List<Team>, lower: Int, upper: Int): Flux<Pick>

    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    @Join("user", type = Join.Type.FETCH)
    fun findAllByGame(aGame: Game): Flux<Pick>

    fun deleteByGame(aGame: Game): Mono<Long>

    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    fun findAllByUserAndGameIdBetween(aUser: User, lower: Int, upper: Int): Flux<Pick>

    fun findByGameAndUserAndTeam(aGame: Game, aUser: User, aTeam: Team): Mono<Pick>

}