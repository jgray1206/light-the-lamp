package io.gray.client

import io.gray.client.model.GameSummaryResponse
import io.gray.client.model.ScheduledGame
import io.micronaut.http.annotation.Get
import io.micronaut.http.client.annotation.Client
import reactor.core.publisher.Mono

@Client("https://lscluster.hockeytech.com/feed/index.php")
interface PWHLClient {
    // Request for games by date (like getGamesByDate in JS)
    @Get("?feed=modulekit&view=scorebar&fmt=json&numberofdaysahead={daysAhead}&numberofdaysback={daysBack}&key=pwhl&client_code=694cfeed58c932ee")
    fun getGamesByDate(
            daysAhead: String,
            daysBack: String
    ): Mono<ScheduledGame>

    // Request for game summary (like getGameSummary in JS)
    @Get("?feed=statviewfeed&view=gameSummary&game_id={gameId}&fmt=json&key=pwhl&client_code=694cfeed58c932ee")
    fun getGameSummary(gameId: String): Mono<GameSummaryResponse>
}