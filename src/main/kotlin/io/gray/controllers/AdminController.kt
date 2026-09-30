package io.gray.controllers

import io.gray.model.AdminUserDetail
import io.gray.model.AdminUserSummary
import io.gray.model.Game
import io.gray.model.Pick
import io.gray.service.AdminService
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.security.Principal

// Admin-only tools (the "admin" role comes from user.admin at login)
@Secured("admin")
@Controller("/admin")
class AdminController(private val adminService: AdminService) {

    @Get("/users")
    fun searchUsers(@QueryValue q: String): Flux<AdminUserSummary> = adminService.searchUsers(q)

    @Get("/users/{id}")
    fun getUser(id: Long): Mono<AdminUserDetail> = adminService.getUser(id)

    @Get("/users/{id}/picks")
    fun getPicks(id: Long, @QueryValue season: String): Flux<Pick> = adminService.getPicks(id, season)

    @Get("/games")
    fun getGames(@QueryValue teamId: Long, @QueryValue season: String): Flux<Game> = adminService.getGames(teamId, season)

    @Put("/users/{id}/picks")
    fun setPick(
        id: Long,
        @QueryValue gameId: Long,
        @QueryValue teamId: Long,
        @QueryValue pick: String,
        principal: Principal
    ): Mono<Pick> = adminService.setPick(principal.name, id, gameId, teamId, pick)

    @Delete("/users/{id}/picks")
    fun deletePick(
        id: Long,
        @QueryValue gameId: Long,
        @QueryValue teamId: Long,
        principal: Principal
    ): Mono<Long> = adminService.deletePick(principal.name, id, gameId, teamId)
}
