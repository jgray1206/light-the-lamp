package io.gray.repos

import io.gray.model.PasswordReset
import io.micronaut.data.annotation.Join
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface PasswordResetRepository : ReactorCrudRepository<PasswordReset, Long> {
    @Join("user", type = Join.Type.FETCH)
    fun findByResetUuid(resetUuid: String): Mono<PasswordReset>

    fun findByUserId(userId: Long): Flux<PasswordReset>
}