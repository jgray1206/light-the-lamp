package io.gray.model

import io.micronaut.core.annotation.Introspected

@Introspected
class Leaderboard {
    var displayName: String? = null
    var email: String? = null
    var games: Int? = null
    var points: Int? = null
    var teamId: Long? = null
}