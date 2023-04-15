package io.gray.repos

import io.gray.model.UserTeam
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface UserTeamRepository : ReactorCrudRepository<UserTeam, Long> {
    fun findByUserId(userId: Long): Flux<UserTeam>
    fun findByUserIdAndTeamId(userId: Long, teamId: Long): Mono<UserTeam>
}