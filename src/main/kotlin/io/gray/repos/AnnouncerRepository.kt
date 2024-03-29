package io.gray.repos

import io.gray.model.Announcer
import io.micronaut.data.annotation.Join
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface AnnouncerRepository : ReactorCrudRepository<Announcer, Long> {

    @Join("team", type = Join.Type.FETCH)
    override fun findAll(): Flux<Announcer>
}
