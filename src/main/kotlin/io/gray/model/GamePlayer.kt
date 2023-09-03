package io.gray.model

import io.micronaut.data.annotation.Embeddable
import io.micronaut.data.annotation.EmbeddedId
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.annotation.Relation
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

@MappedEntity
class GamePlayer {
    @EmbeddedId
    var id: GamePlayerId? = null

    @NotNull
    @Relation(Relation.Kind.MANY_TO_ONE)
    var team: Team? = null

    @NotBlank
    var name: String? = null

    @NotBlank
    var position: String? = null

    var goals: Short? = null
    var assists: Short? = null
    var shortGoals: Short? = null
    var shortAssists: Short? = null
    var goalsAgainst: Short? = null
    var timeOnIce: String? = null
}

@Embeddable
data class GamePlayerId(val gameId: Long, val playerId: Long)