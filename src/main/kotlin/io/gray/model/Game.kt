package io.gray.model

import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.annotation.Relation
import io.micronaut.data.annotation.Relation.Cascade
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import java.time.LocalDateTime

@MappedEntity
class Game {
    @Id
    var id: Long? = null

    @NotNull
    var date: LocalDateTime? = null

    @NotNull
    var gameState: String? = null

    @NotNull
    @Relation(Relation.Kind.MANY_TO_ONE)
    var homeTeam: Team? = null

    var homeTeamGoals: Short? = null

    @NotNull
    @Relation(Relation.Kind.MANY_TO_ONE)
    var awayTeam: Team? = null

    var awayTeamGoals: Short? = null

    @NotNull
    @NotEmpty
    @Relation(Relation.Kind.ONE_TO_MANY, mappedBy = "gameId", cascade = [Cascade.PERSIST])
    var players: List<GamePlayer>? = null

    var isShootout: Boolean? = null

}