package io.gray.repos

import io.gray.model.User
import io.micronaut.data.annotation.Join
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface UserRepository : ReactorCrudRepository<User, Long> {
    @Join("groups", type = Join.Type.LEFT_FETCH)
    @Join("team", type = Join.Type.FETCH)
    override fun findById(aLong: Long): Mono<User>

    @Join("groups", type = Join.Type.LEFT_FETCH)
    @Join("team", type = Join.Type.LEFT_FETCH)
    fun findByEmail(email: String): Mono<User>

    fun findOneByConfirmationUuidAndConfirmed(confirmationUuid: String, confirmed: Boolean): Mono<User>
}
