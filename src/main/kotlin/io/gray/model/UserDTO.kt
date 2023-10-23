package io.gray.model

import io.micronaut.core.annotation.Introspected
import io.micronaut.data.annotation.*

@Introspected
@MappedEntity("user")
class UserDTO {
    @Id
    var id: Long? = null
    var displayName: String? = null
    var redditUsername: String? = null
}