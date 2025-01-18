package io.gray.client.model.pwhl

// GameSummaryDetails data class
data class GameSummaryDetails(
    val id: Int,
    val date: String,
    val gameNumber: String,
    val startTime: String,
    val started: String,
    val final: String,
    val status: String,
    val seasonId: String,
    val GameDateISO8601: String
)

// GameSummaryPeriodGoalAssist data class
data class GameSummaryPeriodGoalAssist(
    val id: Int,
    val firstName: String,
    val lastName: String,
    val playerImageURL: String
)

// GameSummaryPeriodGoal data class
data class GameSummaryPeriodGoal(
    val game_goal_id: String,
    val team: Team,
    val period: Period,
    val time: String,
    val scorerGoalNumber: String,
    val scoredBy: Player,
    val assists: List<GameSummaryPeriodGoalAssist>,
    val assistNumbers: List<String>,
    val properties: Properties
) {
    data class Team(
        val id: Int,
        val name: String,
        val nickname: String,
        val abbreviation: String,
        val logo: String
    )

    data class Period(
        val id: String,
        val shortName: String,
        val longName: String
    )

    data class Player(
        val id: Int,
        val firstName: String,
        val lastName: String,
        val playerImageURL: String
    )

    data class Properties(
        val isPowerPlay: String,
        val isShortHanded: String,
        val isEmptyNet: String,
        val isPenaltyShot: String,
        val isInsuranceGoal: String,
        val isGameWinningGoal: String
    )
}

// GameSummaryPeriod data class
data class GameSummaryPeriod(
    val info: PeriodInfo,
    val stats: PeriodStats,
    val goals: List<GameSummaryPeriodGoal>
) {
    data class PeriodInfo(
        val id: String,
        val shortName: String,
        val longName: String
    )

    data class PeriodStats(
        val homeGoals: String,
        val homeShots: String,
        val visitingGoals: String,
        val visitingShots: String
    )
}

// GameSummaryTeam data class
data class GameSummaryTeam(
    val info: TeamInfo,
    val stats: TeamStats,
    val seasonStats: TeamSeasonStats,
    val skaters: List<Skater>,
    val goalies: List<Goalie>
) {
    data class Skater(
        val info: PlayerInfo,
        val stats: PlayerStats,
        val starting: Int,
        val status: String
    )

    data class PlayerInfo(
        val id: Int,
        val firstName: String,
        val lastName: String,
        val position: String,
        val playerImageUrl: String?
    )

    data class PlayerStats(
        val goals: Int,
        val assists: Int,
        val points: Int,
        val shots: Int,
        val hits: Int,
        val toi: String
    )

    data class Goalie(
        val info: PlayerInfo,
        val stats: GoalieStats,
        val starting: Int,
        val status: String
    )

    data class GoalieStats(
        val goals: Int,
        val assists: Int,
        val points: Int,
        val timeOnIce: String?,
        val shotsAgainst: Int,
        val goalsAgainst: Int,
        val saves: Int
    )

    data class TeamInfo(
        val id: Int,
        val name: String,
        val city: String,
        val nickname: String,
        val abbreviation: String,
        val logo: String
    )

    data class TeamStats(
        val shots: Int,
        val goals: Int
    )

    data class TeamSeasonStats(
        val seasonId: String?,
        val teamRecord: TeamRecord,
        val teamStats: List<Any>
    ) {
        data class TeamRecord(
            val wins: Int,
            val losses: Int,
            val ties: Int,
            val OTWins: Int,
            val OTLosses: Int,
            val SOLosses: Int,
            val formattedRecord: String
        )
    }
}

// ShootoutTeam data class
data class ShootoutTeam(
    val id: Int,
    val name: String,
    val city: String,
    val nickname: String,
    val abbreviation: String,
    val logo: String,
    val divisionName: String
)

// ShootoutPlayer data class
data class ShootoutPlayer(
    val id: Int,
    val firstName: String,
    val lastName: String,
    val jerseyNumber: Int,
    val position: String,
    val birthDate: String,
    val playerImageURL: String
)

// ShootoutShot data class
data class ShootoutShot(
    val shooter: ShootoutPlayer,
    val goalie: ShootoutPlayer,
    val isGoal: Boolean,
    val isGameWinningGoal: Boolean,
    val shooterTeam: ShootoutTeam
)

// ShootoutDetails data class
data class ShootoutDetails(
    val homeTeamShots: List<ShootoutShot>,
    val visitingTeamShots: List<ShootoutShot>,
    val winningTeam: ShootoutTeam
)

// GameSummaryResponse data class
data class GameSummaryResponse(
    val details: GameSummaryDetails,
    val hasShooutout: Boolean,
    val shootoutDetails: ShootoutDetails?,
    val homeTeam: GameSummaryTeam,
    val visitingTeam: GameSummaryTeam,
    val periods: List<GameSummaryPeriod>
)
