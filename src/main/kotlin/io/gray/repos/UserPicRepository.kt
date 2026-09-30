package io.gray.repos

import io.gray.model.UserPic
import io.micronaut.data.annotation.Query
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.reactive.ReactorCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface UserPicRepository : ReactorCrudRepository<UserPic, Long> {

    fun findByIdIn(ids: List<Long>): Flux<UserPic>

    @Query("UPDATE \"user\" SET profile_pic = :profilePic WHERE id = :id")
    fun updateProfilePic(id: Long, profilePic: ByteArray?): Mono<Long>

    /**
     * A pic the viewer is allowed to see: their own, their kid's, their parent's,
     * a friend's, or a friend's kid's. Empty if the viewer isn't allowed.
     */
    @Query(
        """SELECT u.id, u.profile_pic FROM "user" u
           WHERE u.id = :targetId AND (
               u.id = :viewerId
               OR u.parent_id = :viewerId
               OR u.id = (SELECT v.parent_id FROM "user" v WHERE v.id = :viewerId)
               OR EXISTS (
                   SELECT 1 FROM user_user f
                   WHERE f.to_user = :viewerId AND (f.from_user = u.id OR f.from_user = u.parent_id)
               )
           )"""
    )
    fun findVisiblePic(targetId: Long, viewerId: Long): Mono<UserPic>
}
