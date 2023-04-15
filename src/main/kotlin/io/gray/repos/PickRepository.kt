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

    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    @Join("user", type = Join.Type.FETCH)
    fun findAllByGame(aGame: Game): Flux<Pick>

    fun deleteByGame(aGame: Game): Mono<Long>

    @Join("gamePlayer", type = Join.Type.LEFT_FETCH)
    fun findAllByUser(aUser: User): Flux<Pick>

    fun findByGameAndUser(aGame: Game, aUser: User): Mono<Pick>

}