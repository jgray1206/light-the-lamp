package io.gray.client

import io.gray.client.model.pwhl.ScorebarSiteKitWrapper
import io.micronaut.http.annotation.Get
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("https://lscluster.hockeytech.com/feed/")
interface PWHLClient {
    // Request for games by date (like getGamesByDate in JS)
    @Get("index.php?feed=modulekit&view=scorebar&fmt=json&numberofdaysahead={daysAhead}&numberofdaysback={daysBack}&client_code=pwhl&key=694cfeed58c932ee")
    fun getGamesByDate(
        daysAhead: String,
        daysBack: String
    ): Mono<ScorebarSiteKitWrapper>

    @Get("index.php?feed=statviewfeed&view=roster&team_id={teamId}&season_id={seasonId}&client_code=pwhl&key=694cfeed58c932ee&fmt=json")
    fun getRoster(teamId: String, seasonId: String): Mono<String>

    // Request for game summary (like getGameSummary in JS)
    @Get("index.php?feed=statviewfeed&view=gameSummary&game_id={gameId}&fmt=json&client_code=pwhl&key=694cfeed58c932ee")
    fun getGameSummary(gameId: String): Mono<String>
}