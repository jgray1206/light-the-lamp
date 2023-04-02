package io.gray.model

import io.micronaut.data.annotation.GeneratedValue
import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.annotation.Relation
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size

@MappedEntity
class Group {
    @Id
    @GeneratedValue(GeneratedValue.Type.AUTO)
    var id: Long? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var team: Team? = null

    @NotBlank
    @Size(max = 128)
    var name: String? = null

    @Relation(Relation.Kind.MANY_TO_MANY, mappedBy = "groups")
    var users: List<User>? = null

}