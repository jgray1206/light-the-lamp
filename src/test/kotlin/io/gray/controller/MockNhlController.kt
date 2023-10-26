package io.gray.controller

import io.gray.LightTheLampApplicationTests
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal

@Controller("/nhl")
@Secured(SecurityRule.IS_ANONYMOUS)
class MockNhlController {

    @Get("/teams")
    fun getTeams(): String {
         return String(this::class.java.getResourceAsStream("/responses/teams.json")!!.readBytes())
    }

    @Get("/schedule")
    fun getSchedule(
            @QueryValue(value = "teamId") teamId: String?
    ): String {
        return if (teamId == "17") {
            if (LightTheLampApplicationTests.RETURN_FINAL) {
                String(this::class.java.getResourceAsStream("/responses/redwingsschedule_final.json")!!.readBytes())
            } else {
                String(this::class.java.getResourceAsStream("/responses/redwingsschedule.json")!!.readBytes())
            }
        } else {
            if (LightTheLampApplicationTests.RETURN_FINAL) {
                String(this::class.java.getResourceAsStream("/responses/krakenschedule_final.json")!!.readBytes())
            } else {
                String(this::class.java.getResourceAsStream("/responses/krakenschedule.json")!!.readBytes())
            }
        }
    }

    @Get("/teams/{id}/roster")
    @Consumes("application/json")
    fun getTeamRoster(
            @PathVariable(name = "id") id: String?
    ): String {
        return if (id == "17") {
            if (LightTheLampApplicationTests.RETURN_UPDATED_ROSTER) {
                String(this::class.java.getResourceAsStream("/responses/redwingsroster_2.json")!!.readBytes())
            } else {
                String(this::class.java.getResourceAsStream("/responses/redwingsroster_1.json")!!.readBytes())
            }
        } else {
            String(this::class.java.getResourceAsStream("/responses/krakenroster.json")!!.readBytes())
        }
    }

    @Get("/game/{id}/boxscore")
    @Consumes("application/json")
    fun getGameBoxscore(
            @PathVariable(name = "id") id: @NotNull BigDecimal?
    ): String {
        return String(this::class.java.getResourceAsStream("/responses/boxscore.json")!!.readBytes())
    }
}