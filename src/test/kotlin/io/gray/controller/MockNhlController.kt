package io.gray.controller

import io.gray.LightTheLampApplicationTests
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule

@Controller("/nhl")
@Secured(SecurityRule.IS_ANONYMOUS)
class MockNhlController {

    @Get("/franchise")
    @Consumes("application/json")
    fun getFranchises(): String {
        return String(this::class.java.getResourceAsStream("/responses/franchises.json")!!.readBytes())
    }

    @Get("/schedule/{date}")
    @Consumes("application/json")
    fun getSchedule(
            @PathVariable(value = "date") date: String,
    ): String {
        return if (LightTheLampApplicationTests.RETURN_FINAL) {
            String(this::class.java.getResourceAsStream("/responses/schedule_final.json")!!.readBytes())
        } else {
            String(this::class.java.getResourceAsStream("/responses/schedule.json")!!.readBytes())
        }
    }

    @Get("/roster/{team}/{season}")
    @Consumes("application/json")
    fun getRoster(
            @PathVariable(value = "team") teamAbbrev: String,
            @PathVariable(value = "season") season: String
    ): String {
        return if (teamAbbrev == "DET") {
            if (LightTheLampApplicationTests.RETURN_UPDATED_ROSTER) {
                String(this::class.java.getResourceAsStream("/responses/redwingsroster_2.json")!!.readBytes())
            } else {
                String(this::class.java.getResourceAsStream("/responses/redwingsroster_1.json")!!.readBytes())
            }
        } else if (teamAbbrev == "SEA") {
            String(this::class.java.getResourceAsStream("/responses/krakenroster.json")!!.readBytes())
        } else {
            String(this::class.java.getResourceAsStream("/responses/emptyroster.json")!!.readBytes())
        }
    }

    @Get("/gamecenter/{gameId}/boxscore")
    @Consumes("application/json")
    fun getBoxscore(
            @PathVariable(value = "gameId") gameId: String
    ): String {
        return String(this::class.java.getResourceAsStream("/responses/boxscore.json")!!.readBytes())
    }

    @Get("/score/{date}")
    @Consumes("application/json")
    fun getScore(
            @PathVariable(value = "date") date: String
    ): String {
        return String(this::class.java.getResourceAsStream("/responses/score.json")!!.readBytes())
    }
}