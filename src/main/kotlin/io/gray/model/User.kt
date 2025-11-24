package io.gray.model

import com.fasterxml.jackson.annotation.JsonIgnore
import io.micronaut.data.annotation.*
import io.micronaut.data.annotation.Relation.Cascade
import io.micronaut.data.annotation.sql.JoinColumn
import io.micronaut.data.annotation.sql.JoinTable
import io.micronaut.data.model.DataType
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

@MappedEntity
class User {
    @Id
    @GeneratedValue(GeneratedValue.Type.AUTO)
    var id: Long? = null

    @NotBlank
    @Size(max = 50)
    @Email
    var email: String? = null

    @Size(max = 18)
    var displayName: String? = null

    @TypeDef(type = DataType.BYTE_ARRAY)
    var profilePic: ByteArray = byteArrayOf()

    @NotBlank
    @Size(max = 60, min = 60)
    var password: String? = null

    @Relation(Relation.Kind.MANY_TO_MANY)
    var teams: List<Team>? = null

    @Relation(Relation.Kind.ONE_TO_MANY, mappedBy = "parent")
    var kids: List<User>? = null

    @JsonIgnore
    @Relation(Relation.Kind.MANY_TO_ONE)
    @JoinColumn(name = "parent_id")
    var parent: User? = null

    var confirmed: Boolean? = null

    var admin: Boolean? = null

    @NotBlank
    @Size(max = 36)
    var confirmationUuid: String? = null

    var locked: Boolean? = null

    var attempts: Short? = null

    var ipAddress: String? = null

    @Size(max = 40)
    var redditUsername: String? = null

    @Size(max = 255)
    var notificationToken: String? = null

    @Relation(Relation.Kind.MANY_TO_MANY)
    @JoinTable(
        name = "user_user",
        joinColumns = [JoinColumn(name = "to_user")],
        inverseJoinColumns = [JoinColumn(name = "from_user")]
    )
    var friends: List<User>? = null

    fun toUserDTO() : UserDTO {
        var userDto = UserDTO()
        userDto.id = this.id
        userDto.displayName = this.displayName
        userDto.redditUsername = this.redditUsername
        return userDto
    }
}