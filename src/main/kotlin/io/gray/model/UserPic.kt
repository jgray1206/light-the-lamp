package io.gray.model

import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.annotation.TypeDef
import io.micronaut.data.model.DataType

// Just a user's profile pic (same "user" table), so pics are only loaded when they're needed
@MappedEntity("user")
class UserPic {
    @Id
    var id: Long? = null

    @TypeDef(type = DataType.BYTE_ARRAY)
    var profilePic: ByteArray? = null
}
