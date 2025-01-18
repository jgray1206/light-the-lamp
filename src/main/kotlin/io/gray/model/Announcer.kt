package io.gray.model

import io.micronaut.data.annotation.GeneratedValue
import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.annotation.Relation
import jakarta.validation.constraints.Size

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