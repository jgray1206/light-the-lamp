package io.gray.model

import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.MappedEntity
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Size

@MappedEntity
class Team {
    @Id
    var id: Long? = null

    @NotBlank
    @Size(max = 128)
    var teamName: String? = null
}