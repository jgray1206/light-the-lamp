package io.gray.client.model

import com.fasterxml.jackson.annotation.JsonProperty

data class TurnstileResponse(
    val success: Boolean,
    @JsonProperty("error-codes")
    val errorCodes: List<String>
)