package io.gray;

import io.gray.notification.NotificationService
import io.gray.repos.*
import io.micronaut.scheduling.TaskExecutors
import io.micronaut.scheduling.annotation.ExecuteOn
import io.micronaut.scheduling.annotation.Scheduled
import jakarta.inject.Singleton;
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import reactor.core.scheduler.Schedulers
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit


@Singleton
open class PickNotificationSender(
    private val userTeamRepository: UserTeamRepository,
    private val gameRepository: GameRepository,
    private val pickRepository: PickRepository,
    private val notificationService: NotificationService
) {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    @Scheduled(cron = "0 1 * * * *")
    @ExecuteOn(TaskExecutors.IO)
    fun notifyMissingPicks() {
        logger.info("running missing pick notify..")
        val lowerBound = LocalDateTime.now().plusHours(1).truncatedTo(ChronoUnit.HOURS)
        val upperBound = lowerBound.plusHours(1)
        gameRepository.findByDateGreaterThanAndDateLessThanEquals(lowerBound, upperBound)
            .flatMap { game ->
                userTeamRepository.findAllUserIdByTeamIdIn(listOf(game.homeTeam?.id!!, game.awayTeam?.id!!))
                    .collectList()
                    .map { game to it }
            }.flatMap { gameToUserTeamMap ->
                val game = gameToUserTeamMap.first
                val userIds = gameToUserTeamMap.second
                pickRepository.findNotificationTokensByGameIdEqualsAndNotInUserIdList(game.id!!, userIds)
                    .map { "${game.homeTeam?.shortName} v ${game.awayTeam?.shortName}" to it }
            }.flatMap { gameStringToNotificationTokenMap ->
                logger.info(gameStringToNotificationTokenMap.first)
                logger.info(gameStringToNotificationTokenMap.second)
                notificationService.sendNotification(gameStringToNotificationTokenMap.second, "Don't forget to pick!", "Lock your pick in for tonight's ${gameStringToNotificationTokenMap.first} game before it's too late!!!")
            }
            .subscribeOn(Schedulers.boundedElastic())
            .subscribe()
    }
}
