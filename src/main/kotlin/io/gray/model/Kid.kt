package io.gray.model

import com.fasterxml.jackson.annotation.JsonIgnore
import io.micronaut.data.annotation.*
import io.micronaut.data.annotation.sql.JoinColumn
import io.micronaut.data.model.DataType
import jakarta.validation.constraints.Size

@MappedEntity
class Kid {
    @Id
    @GeneratedValue(GeneratedValue.Type.AUTO)
    var id: Long? = null

    @JsonIgnore
    @Relation(Relation.Kind.MANY_TO_ONE)
    @JoinColumn(name = "parent_id")
    var parent: User? = null

    @Size(max = 40)
    var displayName: String? = null

    @TypeDef(type = DataType.BYTE_ARRAY)
    var profilePic: ByteArray = byteArrayOf()

}