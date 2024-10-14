package io.gray.client.model

import com.fasterxml.jackson.annotation.JsonIgnore

data class Schedule(
        val gameWeek: List<GameDay>
)

data class GameDay(
        val date: String,
        @field:JsonIgnore
        var score: Score?,
        val games: List<Game>
)

data class Game(
        @field:JsonIgnore
        var goals: List<Goal>?,
        val id: Long,
        val season: Long,
        val startTimeUTC: String,
        val awayTeam: Team,
        val homeTeam: Team,
        val gameState: GameState,
        val periodDescriptor: PeriodDescriptor?
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

data class PeriodDescriptor (
        val periodType: String?
)