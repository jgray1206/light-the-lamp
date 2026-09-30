import { createStore } from "./store";

export const GAMES_PAGE_SIZE = 5;

// Selections that route loaders need, shared across pages for the session.
// season starts empty and is set to the server's current season when /config loads.
export const prefs = createStore({
    season: null,
    maxGames: GAMES_PAGE_SIZE,
    pickingAs: "self",
    leaderboardView: "friends",
});
