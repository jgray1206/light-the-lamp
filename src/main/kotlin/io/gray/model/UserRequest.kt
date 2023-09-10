package io.gray.model

import io.micronaut.core.annotation.Introspected
import io.micronaut.core.annotation.Nullable
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
    @Size(min = 8, max = 50)
    @NotNull
    var password: String? = null

    @NotBlank
    @NotNull
    var teams: List<Long>? = null

    @NotBlank
    @NotNull
    @Size(max = 18)
    var displayName: String? = null

    @Nullable
    @Size(max = 40)
    var redditUsername: String? = null
}