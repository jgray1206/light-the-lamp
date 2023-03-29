package io.gray

import io.gray.nhl.api.TeamsApi
import io.micronaut.context.annotation.Context
import io.micronaut.runtime.event.annotation.EventListener
import io.micronaut.runtime.server.event.ServerStartupEvent
import java.math.BigDecimal

@Context
class Test(
        val teamsApi: TeamsApi
) {
    //to get pics
    //https://cms.nhl.bamgrid.com/images/headshots/current/168x168/8477968.jpg
    @EventListener
    fun test(e: ServerStartupEvent) {
        println(teamsApi.getTeamRoster(BigDecimal.valueOf(17L), null).block())

    }
}