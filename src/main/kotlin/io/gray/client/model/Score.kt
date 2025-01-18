package io.gray.client.model

data class Score(
    val games: List<ScoreGame>
)

data class ScoreGame(
    val id: Long,
    val goals: List<Goal>?
)

data class Goal(
    val period: Short,
    val playerId: Long,
    val periodDescriptor: Period,
    val assists: List<Assist>,
    val strength: String // sh, ev, pp
)

data class Assist(
    val playerId: Long
)

data class Period(
    val periodType: String //SO, OT, REG
)