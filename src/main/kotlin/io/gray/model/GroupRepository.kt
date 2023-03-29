package io.gray.model

import io.micronaut.data.annotation.Join
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface GroupRepository : ReactorCrudRepository<Group, Long> {
    @Join("users", type = Join.Type.LEFT_FETCH)
    override fun findById(aLong: Long): Mono<Group>
}