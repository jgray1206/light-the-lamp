package io.gray.repos

import io.gray.model.AdminUserSummary
import io.gray.model.User
import io.micronaut.data.annotation.Join
import io.micronaut.data.annotation.Query
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface UserRepository : ReactorCrudRepository<User, Long> {

    @Join("teams", type = Join.Type.LEFT_FETCH)
    @Join("friends", type = Join.Type.LEFT_FETCH)
    @Join("friends.kids", type = Join.Type.LEFT_FETCH)
    @Join("kids", type = Join.Type.LEFT_FETCH)
    fun findByEmailIgnoreCase(email: String): Mono<User>

    fun findOneByConfirmationUuidAndConfirmed(confirmationUuid: String, confirmed: Boolean): Mono<User>

    @Query("SELECT COUNT(*) FROM public.user")
    fun getAllCount(): Mono<Int>

    @Join("teams", type = Join.Type.LEFT_FETCH)
    @Join("kids", type = Join.Type.LEFT_FETCH)
    fun findOneById(id: Long): Mono<User>

    // Admin search: case-insensitive substring match on email or display name (pattern like "%gray%")
    @Query(
        """SELECT id, email, display_name, reddit_username, confirmed, locked, parent_id,
                  COALESCE(OCTET_LENGTH(profile_pic), 0) > 0 AS has_pic
           FROM "user"
           WHERE LOWER(email) LIKE :pattern OR LOWER(display_name) LIKE :pattern
           ORDER BY parent_id NULLS FIRST, email, display_name
           LIMIT 25"""
    )
    fun searchForAdmin(pattern: String): Flux<AdminUserSummary>
}

