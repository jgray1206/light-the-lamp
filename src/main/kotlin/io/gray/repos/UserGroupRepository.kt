package io.gray.repos

import io.gray.model.UserGroup
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface UserGroupRepository : ReactorCrudRepository<UserGroup, Long> {
    fun findByUserIdAndGroupId(userId: Long, groupId: Long): Mono<UserGroup>

    fun findAllByGroupId(groupId: Long): Flux<UserGroup>
}