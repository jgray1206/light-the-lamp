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
        val defense: List<BoxscorePlayer>
)

data class BoxscorePlayer(
        val playerId: Long,
        val goals: Short,
        val assists: Short,
        val shorthandedGoals: Short,
        val shPoints: Short,
        val toi: String?
)

data class TeamBoxscore(
        val id: Long,
        val score: Short
)