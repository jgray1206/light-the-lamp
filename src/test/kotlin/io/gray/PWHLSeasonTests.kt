package io.gray

import io.gray.PWHLGameStateSyncer.Companion.toNhlSeason
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class PWHLSeasonTests {

	// Every season in the PWHL seasons feed as of 2026-09, with the ids the old hardcoded table used
	@Test
	fun mapsFeedSeasonNamesToNhlSeasons() {
		val expected = mapOf(
				("2024 Preseason" to false) to "202301",
				("2024 Regular Season" to false) to "202302",
				("2024 Playoffs" to true) to "202303",
				("2024-25 Preseason" to false) to "202401",
				("2024-25 Regular Season" to false) to "202402", // old table: 5
				("2025 Playoffs" to true) to "202403", // 6
				("2025-26 Preseason" to false) to "202501", // 7
				("2025-26 Regular Season" to false) to "202502", // 8
				("2026 Playoffs" to true) to "202503", // 9
				("2026-27 Pre-Season" to false) to "202601", // 10
				("2026-27 Regular Season" to false) to "202602", // 11
				("2027 Playoffs" to true) to "202603", // 12
		)
		expected.forEach { (input, season) ->
			assertThat(toNhlSeason(input.first, input.second)).describedAs(input.first).isEqualTo(season)
		}
	}

	@Test
	fun handlesOddNames() {
		assertThat(toNhlSeason("2027-2028 Regular Season", false)).isEqualTo("202702")
		assertThat(toNhlSeason("2027-28 Pre Season", false)).isEqualTo("202701")
		assertThat(toNhlSeason("2028 Playoffs", false)).isEqualTo("202703") // named playoffs, flag missing
		assertThat(toNhlSeason("All-Star Showcase", false)).isNull()
	}
}
