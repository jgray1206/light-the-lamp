package io.gray.model

import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.MappedEntity
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

@MappedEntity
class Team {
    @Id
    var id: Long? = null

    @NotBlank
    @Size(max = 128)
    var teamName: String? = null

    @NotBlank
    @Size(max = 8)
    var abbreviation: String? = null

    @NotBlank
    @Size(max = 32)
    var shortName: String? = null

    var league: League? = null
}