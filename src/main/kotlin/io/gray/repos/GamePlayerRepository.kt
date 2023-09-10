package io.gray.repos

import io.gray.model.GamePlayer
import io.gray.model.GamePlayerId
import io.micronaut.data.annotation.Join
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface GamePlayerRepository : ReactorCrudRepository<GamePlayer, GamePlayerId> {
    @Join("team", type = Join.Type.FETCH)
    override fun findById(aGamePlayerId: GamePlayerId): Mono<GamePlayer>
}