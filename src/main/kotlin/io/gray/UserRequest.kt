package io.gray

import io.micronaut.core.annotation.Introspected
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Size

@Introspected
class UserRequest {
    @NotBlank
    @Size(max = 50)
    @Email
    var email: String? = null

    @NotBlank
    @Size(min = 12)
    var password: String? = null

    @NotBlank
    var teamId: Long? = null
}