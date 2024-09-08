package io.gray.dto

import io.gray.model.Team

class LeaderboardDTO {
    var displayName: String? = null
    var isAnnouncer: Boolean? = null
    var isMe: Boolean? = null
    var games: Int? = null
    var points: Int? = null
    var team: Team? = null
}