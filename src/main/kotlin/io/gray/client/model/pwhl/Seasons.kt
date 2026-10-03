package io.gray.client.model.pwhl

import com.fasterxml.jackson.annotation.JsonProperty

data class SeasonsSiteKitWrapper(
    @JsonProperty("SiteKit")
    val siteKit: SeasonsSiteKit
)

data class SeasonsSiteKit(
    @JsonProperty("Seasons")
    val seasons: List<PWHLSeason>
)

data class PWHLSeason(
    @JsonProperty("season_id")
    val seasonId: String,
    // e.g. "2025-26 Regular Season", "2026-27 Pre-Season", "2026 Playoffs"
    @JsonProperty("season_name")
    val seasonName: String,
    @JsonProperty("playoff")
    val playoff: String?
)
