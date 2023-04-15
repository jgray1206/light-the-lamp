package io.gray.repos

import io.gray.model.UserUser
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface FriendRepository : ReactorCrudRepository<UserUser, Long> {
    fun findOneByToUserAndFromUser(toUser: Long, fromUser: Long): Mono<UserUser>
}