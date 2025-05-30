package io.gray.client.model

data class Boxscore(
    val awayTeam: TeamBoxscore,
    val homeTeam: TeamBoxscore,
    val playerByGameStats: BothTeamStats
)

data class BothTeamStats(
    val awayTeam: TeamStats,
    val homeTeam: TeamStats
)

data class TeamStats(
    val forwards: List<BoxscorePlayer>,
    val defense: List<BoxscorePlayer>,
    val goalies: List<BoxscoreGoalie>
)

data class BoxscoreGoalie(
    val playerId: Long,
    val goalsAgainst: Short
)

data class BoxscorePlayer(
    val playerId: Long,
    val toi: String?
)

data class TeamBoxscore(
    val id: Long,
    val score: Short
)