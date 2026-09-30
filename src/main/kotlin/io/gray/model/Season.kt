package io.gray.model

import io.micronaut.core.annotation.Introspected

@Introspected
data class Season(val id: String, val label: String) {
    companion object {
        // Season ids come from NHL game ids: start year + game type, e.g. "202502" = 2025-26 regular season
        fun fromId(id: String): Season {
            val startYear = id.take(4).toIntOrNull() ?: return Season(id, id)
            val years = "$startYear-${(startYear + 1).toString().takeLast(2)}"
            val label = when (id.drop(4)) {
                "01" -> "$years Pre"
                "02" -> years
                "03" -> "$years Post"
                else -> id
            }
            return Season(id, label)
        }
    }
}
