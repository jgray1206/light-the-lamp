import { groupBy } from "./picks";

/**
 * Turns a flat list of picks into per-team standings.
 * filter: "all" | "mine" (only games I picked) | "announcers" (only games announcers picked)
 * Returns { [teamName]: [{ key, rank, displayName, redditUsername, games, points, isMe, isAnnouncer }] }
 */
export function buildStandings(picks, filter, userId) {
    const isMe = (user) => user != null && String(user.id) === String(userId);
    const byTeam = groupBy(picks, (p) => p.team.teamName);
    const standings = {};

    for (const [teamName, teamPicks] of Object.entries(byTeam)) {
        const includedGames = new Set(
            teamPicks
                .filter((p) => (filter === "mine" && isMe(p.user)) || (filter === "announcers" && p.announcer))
                .map((p) => p.game.id)
        );
        const counts = (p) => filter === "all" || includedGames.has(p.game.id);

        const rows = Object.entries(groupBy(teamPicks, (p) => p.user?.id ?? p.announcer.displayName))
            .map(([key, userPicks]) => {
                const counted = userPicks.filter(counts);
                const first = userPicks[0];
                const isAnnouncer = first.announcer != null;
                return {
                    key,
                    displayName: first.user?.displayName || first.announcer?.displayName,
                    redditUsername: isAnnouncer ? null : first.user?.redditUsername,
                    isAnnouncer,
                    isMe: !isAnnouncer && isMe(first.user),
                    games: counted.length,
                    points: counted.reduce((sum, p) => sum + (p.points || 0) * (p.doublePoints ? 2 : 1), 0),
                };
            })
            .filter((row) => row.games > 0)
            .sort((a, b) => b.points - a.points || a.games - b.games);

        // Ties (same points and same number of picks) share a rank
        rows.forEach((row, i) => {
            const prev = rows[i - 1];
            row.rank = prev && prev.points === row.points && prev.games === row.games ? prev.rank : i + 1;
        });

        if (rows.length) standings[teamName] = rows;
    }
    return standings;
}
