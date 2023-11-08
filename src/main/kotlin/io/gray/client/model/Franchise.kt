package io.gray.client.model

data class Franchises(
        val data: List<Franchise>
)

data class Franchise (
        val id: Long,
        val fullName: String,
        val teamCommonName: String,
        val teamPlaceName: String
)
