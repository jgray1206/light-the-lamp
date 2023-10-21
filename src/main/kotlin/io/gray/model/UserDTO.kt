package io.gray.model

import io.micronaut.core.annotation.Introspected
import io.micronaut.data.annotation.*

@Introspected
@MappedEntity("user")
data class UserDTO(
    @field:Id
    var id: Long? = null,
    var displayName: String? = null,
    var redditUsername: String? = null
)