package io.gray.client.model

data class TurnstileRequest(
    val secret: String,
    val response: String
)