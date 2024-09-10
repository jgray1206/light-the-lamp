package io.gray.model

import io.micronaut.core.annotation.Introspected
import io.micronaut.core.annotation.Nullable
import jakarta.validation.constraints.*

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

    @NotEmpty
    @NotNull
    var teams: List<Long>? = null

    @NotBlank
    @NotNull
    @Size(max = 18)
    var displayName: String? = null

    @Nullable
    @Size(max = 40)
    var redditUsername: String? = null

    @NotBlank
    var turnstileToken: String? = null
}