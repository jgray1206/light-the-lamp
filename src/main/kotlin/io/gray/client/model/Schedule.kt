package io.gray.client.model

data class Schedule(
        val gameWeek: List<GameDay>
)

data class GameDay(
        val date: String,
        val games: List<Game>
)

data class Game(
        val id: Long,
        val season: Long,
        val startTimeUTC: String,
        val awayTeam: Team,
        val homeTeam: Team,
        val gameState: GameState
)

enum class GameState {
    OFF, LIVE, FUT, FINAL, CRIT, PRE
}

data class Team(
        val id: Long,
        val placeName: Name,
        val abbrev: String,
        val score: Short,
) {
    lateinit var dbTeam: io.gray.model.Team
}

data class Name (
        val default: String
)