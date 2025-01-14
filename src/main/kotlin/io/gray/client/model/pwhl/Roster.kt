package io.gray.client.model.pwhl

import com.fasterxml.jackson.annotation.JsonProperty


data class RosterResponse(
    @JsonProperty("teamName") val teamName: String,
    @JsonProperty("seasonName") val seasonName: String,
    @JsonProperty("roster") val roster: List<RosterSections>
)

data class RosterSections(
    val sections: List<RosterSection>
)

data class RosterSection(
    @JsonProperty("title") val title: String,
    @JsonProperty("data") val data: List<PlayerData>
)

data class PlayerData(
    @JsonProperty("row") val row: PlayerRow
)

data class PlayerRow(
    @JsonProperty("name") val name: String,
    @JsonProperty("position") val position: String?,
    @JsonProperty("player_id") val playerId: String?
)

