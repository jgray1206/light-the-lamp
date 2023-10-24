package io.gray.controller

import com.fasterxml.jackson.databind.ObjectMapper
import io.micronaut.http.annotation.*
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule

@Controller("/nhl")
@Secured(SecurityRule.IS_ANONYMOUS)
class MockNhlController {
    var mapper = ObjectMapper()
    @Get("/teams")
    fun getTeams(): String {
         return String(this::class.java.getResourceAsStream("/responses/teams.json")!!.readBytes())
    }

    @Get("/schedule")
    fun getSchedule(
            @QueryValue(value = "teamId") teamId: String?
    ): String {
        return if (teamId == "17") {
            String(this::class.java.getResourceAsStream("/responses/redwingsschedule.json")!!.readBytes())
        } else {
            String(this::class.java.getResourceAsStream("/responses/krakenschedule.json")!!.readBytes())
        }
    }

    @Get("/teams/{id}/roster")
    @Consumes("application/json")
    fun getTeamRoster(
            @PathVariable(name = "id") id: String?
    ): String {
        return if (id == "17") {
            String(this::class.java.getResourceAsStream("/responses/redwingsroster.json")!!.readBytes())
        } else {
            String(this::class.java.getResourceAsStream("/responses/krakenroster.json")!!.readBytes())
        }
    }
}