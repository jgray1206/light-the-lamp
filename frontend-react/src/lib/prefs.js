import { createStore } from "./store";

export const SEASONS = [
    { value: "202602", label: "2026-27" },
    { value: "202601", label: "2026-27 Pre" },
    { value: "202503", label: "2025-26 Post" },
    { value: "202502", label: "2025-26" },
    { value: "202501", label: "2025-26 Pre" },
    { value: "202403", label: "2024-25 Post" },
    { value: "202402", label: "2024-25" },
    { value: "202401", label: "2024-25 Pre" },
    { value: "202303", label: "2023-24 Post" },
    { value: "202302", label: "2023-24" },
];

export const GAMES_PAGE_SIZE = 5;

// Selections that route loaders need, shared across pages for the session.
export const prefs = createStore({
    season: SEASONS[0].value,
    maxGames: GAMES_PAGE_SIZE,
    pickingAs: "self",
    leaderboardView: "friends",
});
