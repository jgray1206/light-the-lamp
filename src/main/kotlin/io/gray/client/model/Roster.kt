package io.gray.client.model

data class Roster(
        val forwards: List<Player>,
        val defensemen: List<Player>,
        val goalies: List<Player>
)

data class Player(
        val id: Long,
        val firstName: Name,
        val lastName: Name,
        val sweaterNumber: Short,
        val positionCode: Char
) {
    lateinit var position: String
}

