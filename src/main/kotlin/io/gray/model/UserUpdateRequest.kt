package io.gray.model

import io.micronaut.core.annotation.Introspected
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size

@Introspected
open class UserUpdateRequest {

    @NotBlank
    @Size(max = 50)
    var displayName: String? = null

    @NotBlank
    @Size(max = 665000)
    var profilePic: String? = null
}