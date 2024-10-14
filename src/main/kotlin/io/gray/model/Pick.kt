package io.gray.model

import io.micronaut.data.annotation.GeneratedValue
import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.annotation.Relation

@MappedEntity("pick")
class Pick {
    @Id
    @GeneratedValue(GeneratedValue.Type.AUTO)
    var id: Long? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var user: UserDTO? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var announcer: Announcer? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var game: Game? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var team: Team? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var gamePlayer: GamePlayer? = null

    var goalies: Boolean? = null

    var theTeam: Boolean? = null

    var points: Short? = null

    var doublePoints: Boolean? = null

}