package io.gray.model

import io.micronaut.data.annotation.*
import io.micronaut.data.jdbc.annotation.JoinColumn
import io.micronaut.data.jdbc.annotation.JoinTable
import io.micronaut.data.model.DataType
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Size

@MappedEntity
class Announcer {
    @Id
    @GeneratedValue(GeneratedValue.Type.AUTO)
    var id: Long? = null

    @Size(max = 32)
    var displayName: String? = null

    @Size(max = 32)
    var nickname: String? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var team: Team? = null

}