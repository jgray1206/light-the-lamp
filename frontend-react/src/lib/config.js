import api from "./api";
import { prefs } from "./prefs";
import { createStore } from "./store";

// Server settings from /api/config: the season list, the current season and ALLOW_ALL_PICKS dev mode.
// Fetched once per app load, before any loader that needs a season.
const configStore = createStore({ allowAllPicks: false, currentSeason: null, seasons: [] });
let request;

export function loadConfig() {
    request ??= api.get("/api/config").then(({ data }) => {
        configStore.set(data);
        if (!prefs.get().season) prefs.set({ season: data.currentSeason });
        return configStore.get();
    });
    // Let a later navigation retry if this one failed
    request.catch(() => { request = undefined; });
    return request;
}

export const useConfig = configStore.useStore;
