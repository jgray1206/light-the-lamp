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
    var group: Group? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var user: User? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var game: Game? = null

    @Relation(Relation.Kind.MANY_TO_ONE)
    var gamePlayer: GamePlayer? = null

    var goalies: Boolean? = null

    var team: Boolean? = null

    var points: Short? = null

}