package io.gray.model

import io.micronaut.core.annotation.Introspected
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size

@Introspected
open class UserRequest {
    @NotBlank
    @Size(max = 50)
    @Email
    @NotNull
    var email: String? = null

    @NotBlank
    @Size(min = 12, max = 50)
    @NotNull
    var password: String? = null

    @NotBlank
    @NotNull
    var teamId: Long? = null
}