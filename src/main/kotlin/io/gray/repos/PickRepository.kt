package io.gray.repos

import io.gray.model.*
import io.micronaut.data.annotation.Join
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface PickRepository : ReactorCrudRepository<Pick, Long> {
    @Join("group", type = Join.Type.FETCH)
    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    fun findAllByGame(aGame: Game): Flux<Pick>

    fun deleteByGame(aGame: Game): Mono<Long>

    @Join("group", type = Join.Type.FETCH)
    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    fun findAllByUser(aUser: User): Flux<Pick>

    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    fun findAllByGroup(aGroup: Group): Flux<Pick>

    fun findByGameAndUserAndGroup(aGame: Game, aUser: User, aGroup: Group): Mono<Pick>
    fun findByGameAndUser(aGame: Game, aUser: User): Mono<Pick>

}