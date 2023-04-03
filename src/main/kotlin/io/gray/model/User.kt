package io.gray.model

import io.micronaut.data.annotation.GeneratedValue
import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.annotation.Relation
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Size

@MappedEntity
class User {
    @Id
    @GeneratedValue(GeneratedValue.Type.AUTO)
    var id: Long? = null

    @NotBlank
    @Size(max = 50)
    @Email
    var email: String? = null

    @NotBlank
    @Size(max = 60, min = 60)
    var password: String? = null

    var confirmed: Boolean? = null

    var locked: Boolean? = null

    var attempts: Short? = null

    var ipAddress: String? = null

    @Relation(Relation.Kind.MANY_TO_MANY)
    var groups: List<Group>? = null

}