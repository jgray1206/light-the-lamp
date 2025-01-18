package io.gray.controllers

import io.gray.dto.LeaderboardDTO
import io.gray.repos.PickRepository
import io.gray.repos.UserRepository
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.QueryValue
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import reactor.core.publisher.Flux
import java.security.Principal

@Secured(SecurityRule.IS_AUTHENTICATED)
@Controller("/leaderboard")
class LeaderboardController(
    private val pickRepository: PickRepository,
    private val userRepository: UserRepository
) {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    @Get
    fun getAll(principal: Principal, @QueryValue season: String): Flux<LeaderboardDTO> {
        return userRepository.findByEmailIgnoreCase(principal.name).flatMapMany { user ->
            if (user.teams == null || user.teams!!.isEmpty()) {
                return@flatMapMany Flux.empty()
            }
            Flux.concat(
                pickRepository.getLeaderboardForUsersByGameIdAndTeam(season, user.teams!!.map { it.id!! }),
                pickRepository.getLeaderboardForAnnouncersByGameIdAndTeam(season, user.teams!!.map { it.id!! })
            )
                .map {
                    LeaderboardDTO().apply {
                        this.team = user.teams?.first { team -> it.teamId == team.id }
                        this.isAnnouncer = it.email?.isBlank()
                        this.isMe = it.email == principal.name
                        this.points = it.points
                        this.games = it.games
                        this.displayName = it.displayName
                    }
                }.sort { o1, o2 -> (o2.points ?: 0) - (o1.points ?: 0) }
        }
    }

    @Get("/friends-and-self")
    fun getPicksByUserFriendsAndUser(principal: Principal, @QueryValue season: String): Flux<LeaderboardDTO> {
        return userRepository.findByEmailIgnoreCase(principal.name).filter { it.friends != null && it.teams != null }
            .flatMapMany { user ->
                pickRepository.getLeaderboardForUsersByGameIdAndTeamAndUserIdIn(
                    season,
                    user.teams!!.map { it.id!! },
                    user.friends!!.plus(user).map { it.id!! }).map {
                    LeaderboardDTO().apply {
                        this.team = user.teams?.first { team -> it.teamId == team.id }
                        this.isAnnouncer = false
                        this.isMe = it.email == principal.name
                        this.points = it.points
                        this.games = it.games
                        this.displayName = it.displayName
                    }
                }.sort { o1, o2 -> (o2.points ?: 0) - (o1.points ?: 0) }
            }
    }


    @Get("/reddit")
    fun getPicksByReddit(principal: Principal, @QueryValue season: String): Flux<LeaderboardDTO> {
        return userRepository.findByEmailIgnoreCase(principal.name).flatMapMany { user ->
            if (user.teams == null || user.teams!!.isEmpty()) {
                return@flatMapMany Flux.empty()
            }
            pickRepository.getRedditLeaderboardForUsersByGameIdAndTeam(season, user.teams!!.map { it.id!! })
                .map {
                    LeaderboardDTO().apply {
                        this.team = user.teams?.first { team -> it.teamId == team.id }
                        this.isAnnouncer = it.email?.isBlank()
                        this.isMe = it.email == principal.name
                        this.points = it.points
                        this.games = it.games
                        this.displayName = it.displayName
                    }
                }.sort { o1, o2 -> (o2.points ?: 0) - (o1.points ?: 0) }
        }
    }
}
