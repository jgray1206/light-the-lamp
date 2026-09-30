// Pure helpers for the Picks page: game ordering, scoring and building the pick rows.

export const pickKey = (gameId, teamId) => `${gameId}-${teamId}`;

// Game dates come from the API as [year, month, day, hour, minute] in UTC.
export const gameStart = (game) =>
    new Date(Date.UTC(game.date[0], game.date[1] - 1, game.date[2], game.date[3], game.date[4]));

// Picks lock 5 minutes after puck drop
export const pickLockTime = (game) => new Date(gameStart(game).getTime() + 5 * 60 * 1000);

// Newest first
export const sortGames = (games) =>
    [...games].sort((a, b) => gameStart(b) - gameStart(a) || b.id - a.id);

export function groupBy(items, keyFn) {
    const groups = {};
    for (const item of items) {
        for (const key of [keyFn(item)].flat()) {
            (groups[key] ||= []).push(item);
        }
    }
    return groups;
}

export const gamesByTeam = (games) => groupBy(games, (g) => [g.awayTeam.id, g.homeTeam.id]);

// The earliest game that is live or upcoming, else the most recent one (games are newest first)
export const activeGame = (games) =>
    games?.findLast((g) => g.gameState === "Live" || g.gameState === "Preview") || games?.[0];

export function headshotUrl(game, team, playerId, season) {
    if (game.league === "PWHL") {
        return `https://assets.leaguestat.com/pwhl/240x240/${playerId}.jpg`;
    }
    const startYear = Number(season.substring(0, 4));
    return `https://assets.nhle.com/mugs/nhl/${startYear}${startYear + 1}/${team.abbreviation}/${playerId}.png`;
}

export function gameLabel(game, team) {
    const start = gameStart(game);
    const date = `${start.getMonth() + 1}/${start.getDate()}`;
    const opponent = game.awayTeam.id === team.id ? `@ ${game.homeTeam.shortName}` : `v ${game.awayTeam.shortName}`;
    return { date, opponent };
}

const friendPickKey = (pick) =>
    pick.gamePlayer?.id?.playerId || (pick.theTeam && "theTeam") || (pick.goalies && "goalies");

// Announcers (no id) first, then alphabetical
function friendsWhoPicked(picks = []) {
    return picks
        .map((p) => (p.user ? { name: p.user.displayName, id: p.user.id } : { name: p.announcer?.nickname ?? "" }))
        .sort((a, b) => (a.id !== undefined) - (b.id !== undefined) || a.name.localeCompare(b.name));
}

// Short scoring reminders shown while picking (full rules are on the About page)
const HINTS = {
    Forward: ["Goal 2", "Assist 1", "OT goal +5", "SH ×2"],
    Defenseman: ["Goal 3", "Assist 1", "OT goal +5", "SH ×2"],
    goalies: ["Shutout 5", "1–2 GA 3", "Assist 5"],
    team: ["1 per goal if they score 4+"],
};

function skaterScore(player) {
    const d = player.position === "Defenseman";
    const scored = d || player.position === "Forward";
    const points = !scored ? 0 :
        (player.goals || 0) * (d ? 3 : 2) +
        (player.otGoals || 0) * (d ? 8 : 7) +
        (player.otShortGoals || 0) * (d ? 16 : 14) +
        (player.assists || 0) +
        (player.shortGoals || 0) * (d ? 6 : 4) +
        (player.shortAssists || 0) * 2;
    const stats = [
        player.goals && `G: ${player.goals}`,
        player.otGoals && "OT G: 1",
        player.otShortGoals && "OT SHG: 1",
        player.assists && `A: ${player.assists}`,
        player.shortGoals && `SHG: ${player.shortGoals}`,
        player.shortAssists && `SHA: ${player.shortAssists}`,
    ].filter(Boolean);
    return { points, stats };
}

function goaliesScore(game, side) {
    const goalsAgainst = (side === "home" ? game.homeTeamGoaliesGoalsAgainst : game.awayTeamGoaliesGoalsAgainst) || 0;
    const totalGoalsAgainst = (side === "home" ? game.awayTeamGoals : game.homeTeamGoals) || 0;
    const assists = (side === "home" ? game.homeTeamGoalieAssists : game.awayTeamGoalieAssists) || 0;
    const points = (goalsAgainst > 2 ? 0 : goalsAgainst > 0 ? 3 : 5) + assists * 5;
    const stats = [`GA: ${goalsAgainst}`];
    if (goalsAgainst !== totalGoalsAgainst) stats.push(`EN/SO: ${totalGoalsAgainst - goalsAgainst}`);
    if (assists > 0) stats.push(`A: ${assists}`);
    return { points, stats };
}

function teamScore(game, side) {
    const goals = (side === "home" ? game.homeTeamGoals : game.awayTeamGoals) || 0;
    const otherGoals = (side === "home" ? game.awayTeamGoals : game.homeTeamGoals) || 0;
    // The shootout winner is credited a goal that doesn't count here
    const realGoals = game.isShootout === true && goals > otherGoals ? goals - 1 : goals;
    const stats = [`G: ${realGoals}`];
    if (goals !== realGoals) stats.push("SO Goals: 1");
    return { points: realGoals >= 4 ? realGoals : 0, stats };
}

// "open" (can pick), "picked" (your pick is in), "locked" (started, no pick) or "done" (final).
// allowAllPicks is the server's dev mode: every game without a pick stays open.
export function gameStatus(game, pick, { now = new Date(), allowAllPicks = false } = {}) {
    if (pick) return game.gameState === "Final" ? "done" : "picked";
    if (allowAllPicks || pickLockTime(game) > now) return "open";
    return game.gameState === "Final" ? "done" : "locked";
}

const lastNameFirst = (name) => name.split(" ").reverse().join(",");

/**
 * Everything the Picks page needs to render one game for one team.
 * teamGames: this team's games, newest first. index: position of `game` in teamGames.
 */
export function buildGameView({ game, team, teamGames, index, myPicksMap, friendsPicks, season, now = new Date(), allowAllPicks = false }) {
    const key = pickKey(game.id, team.id);
    const pick = myPicksMap.get(key);
    const status = gameStatus(game, pick, { now, allowAllPicks });
    const pickEnabled = status === "open";
    const side = game.awayTeam.id === team.id ? "away" : "home";

    const prevGame = teamGames[index + 1];
    const prevPicks = [teamGames[index + 1], teamGames[index + 2]]
        .filter(Boolean)
        .map((g) => myPicksMap.get(pickKey(g.id, team.id)))
        .filter(Boolean);

    const friendsByPick = groupBy(friendsPicks.filter((p) => pickKey(p.game.id, p.team.id) === key), friendPickKey);

    // Only flag "no time on ice" if last game's box score actually has TOI data
    const prevToi = new Map(prevGame?.players.map((p) => [p.id.playerId, p.timeOnIce]) ?? []);
    const prevGameHasToi = [...prevToi.values()].some((toi) => toi && toi !== "0:00");

    const teamPlayers = game.players.filter((p) => p.team.id === team.id);
    const skaters = teamPlayers
        .filter((p) => p.position !== "Goalie")
        .sort((a, b) => (lastNameFirst(a.name) > lastNameFirst(b.name) ? 1 : -1));
    const goalies = teamPlayers.filter((p) => p.position === "Goalie");

    const rows = skaters.map((player) => {
        const toi = prevToi.get(player.id.playerId);
        return {
            key: String(player.id.playerId),
            pickValue: player.name,
            name: player.name,
            position: player.position === "Defenseman" ? "D" : "F",
            imgs: [headshotUrl(game, team, player.id.playerId, season)],
            hints: HINTS[player.position] ?? [],
            ...(pickEnabled ? { points: 0, stats: [] } : skaterScore(player)),
            noToi: prevGameHasToi && (toi === undefined || toi === "0:00"),
            onCooldown: prevPicks.some((p) => p.gamePlayer?.name === player.name),
            picked: pick?.gamePlayer?.id.playerId === player.id.playerId,
            friends: friendsWhoPicked(friendsByPick[player.id.playerId]),
        };
    });

    rows.push({
        key: "goalies",
        pickValue: "goalies",
        name: "The Goalies",
        imgs: goalies.map((g) => headshotUrl(game, team, g.id.playerId, season)),
        hints: HINTS.goalies,
        ...(pickEnabled ? { points: 0, stats: [] } : goaliesScore(game, side)),
        noToi: false,
        onCooldown: prevPicks.some((p) => p.goalies),
        picked: pick?.goalies != null,
        friends: friendsWhoPicked(friendsByPick.goalies),
    });

    rows.push({
        key: "team",
        pickValue: "team",
        name: `The ${team.teamName}!`,
        imgs: [],
        hints: HINTS.team,
        ...(pickEnabled ? { points: 0, stats: [] } : teamScore(game, side)),
        noToi: false,
        onCooldown: prevPicks.some((p) => p.theTeam),
        picked: pick?.theTeam != null,
        friends: friendsWhoPicked(friendsByPick.theTeam),
    });

    // Your pick goes on top
    rows.sort((a, b) => b.picked - a.picked);

    return { key, game, pick, pickEnabled, status, rows };
}

export const teamLogoUrl = (game, team, theme) =>
    game.league === "PWHL" ? null : `https://assets.nhle.com/logos/nhl/svg/${team.abbreviation}_${theme}.svg`;
