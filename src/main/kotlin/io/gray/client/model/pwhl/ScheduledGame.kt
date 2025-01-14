package io.gray.client.model.pwhl

import com.fasterxml.jackson.annotation.JsonProperty
import io.gray.model.Team

data class ScorebarSiteKitWrapper(
    @JsonProperty("SiteKit")
    val siteKit: ScorebarSiteKit
)

data class ScorebarSiteKit(
    @JsonProperty("Scorebar")
    val scheduledGames: List<ScheduledGame>
)

// ScheduledGame data class
data class ScheduledGame(
    val ID: String,
    val SeasonID: String,
    val league_id: String,
    val game_number: String,
    val game_letter: String?,
    val game_type: String?,
    val quick_score: String,
    val Date: String,
    val GameDate: String,
    val GameDateISO8601: String,
    val ScheduledTime: String,
    val ScheduledFormattedTime: String,
    val Timezone: String,
    val TicketUrl: String,
    val HomeID: String,
    val HomeCode: String,
    val HomeCity: String,
    val HomeNickname: String,
    val HomeLongName: String,
    val HomeDivision: String,
    val HomeGoals: String,
    val VisitorID: String,
    val VisitorCode: String,
    val VisitorCity: String,
    val VisitorNickname: String,
    val VisitorLongName: String,
    val VisitingDivision: String,
    val VisitorGoals: String,
    val Period: String,
    val PeriodNameShort: String,
    val PeriodNameLong: String,
    val GameClock: String,
    val GameSummaryUrl: String,
    val HomeWins: String,
    val HomeRegulationLosses: String,
    val HomeOTLosses: String,
    val HomeShootoutLosses: String,
    val VisitorWins: String,
    val VisitorRegulationLosses: String,
    val VisitorOTLosses: String,
    val VisitorShootoutLosses: String,
    val GameStatus: String,
    val Intermission: String,
    val GameStatusString: String,
    val GameStatusStringLong: String,
    val Ord: String,
    val venue_name: String,
    val venue_location: String,
    val league_name: String,
    val league_code: String,
    val TimezoneShort: String,
    var gameSummaryResponse: GameSummaryResponse?,
    var homeTeam: Team?,
    var awayTeam: Team?
) {
    fun getGameId(): Long {
        return "${mapSeasonId(SeasonID)}${mapId(ID)}".toLong()
    }

    fun mapSeasonId(seasonId: String): String {
        return when(seasonId) {
            "5" -> "202402"
            else -> seasonId
        }
    }

    fun mapId(id: String): String {
        return id.padStart(4, '9')
    }
}
