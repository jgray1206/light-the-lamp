package io.gray.model

import io.micronaut.core.annotation.Introspected

// Read-only views of users for the admin page

@Introspected
data class AdminUserSummary(
    val id: Long,
    val email: String?,
    val displayName: String?,
    val redditUsername: String?,
    val confirmed: Boolean?,
    val locked: Boolean?,
    val parentId: Long?,
    val hasPic: Boolean = false
)

@Introspected
data class AdminUserRef(val id: Long, val email: String?, val displayName: String?)

@Introspected
data class AdminUserDetail(
    val id: Long,
    val email: String?,
    val displayName: String?,
    val redditUsername: String?,
    val confirmed: Boolean?,
    val locked: Boolean?,
    /** base64, empty if none */
    val profilePic: String = "",
    /** a kid's teams are their parent's */
    val teams: List<Team> = emptyList(),
    val kids: List<AdminUserRef> = emptyList(),
    val parent: AdminUserRef? = null
)
