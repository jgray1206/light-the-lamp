package io.gray.model

import io.micronaut.data.annotation.*
import java.time.Instant
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

@MappedEntity
class PasswordReset {
    @Id
    @GeneratedValue(GeneratedValue.Type.AUTO)
    var id: Long? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var user: User? = null

    @NotBlank
    @Size(max = 36)
    var resetUuid: String? = null

    @DateCreated
    var createTime: Instant? = null
}