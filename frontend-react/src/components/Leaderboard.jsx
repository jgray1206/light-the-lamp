import { useMemo, useState } from "react";
import { useLoaderData, useRevalidator } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { useAuth } from "../lib/auth";
import { buildStandings } from "../lib/leaderboard";
import { prefs } from "../lib/prefs";
import ChipNav from "./ChipNav";
import RefreshButton from "./RefreshButton";
import SeasonSelect from "./SeasonSelect";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
    const picks = useLoaderData();
    const revalidator = useRevalidator();
    const { userId } = useAuth();
    const { season, leaderboardView } = prefs.useStore();
    const [filter, setFilter] = useState("all");
    const [selectedTeam, setSelectedTeam] = useState(null);

    // The announcer filter only exists on the global board
    const effectiveFilter = filter === "announcers" && leaderboardView !== "global" ? "all" : filter;
    const standings = useMemo(() => buildStandings(picks, effectiveFilter, userId), [picks, effectiveFilter, userId]);
    const teams = Object.keys(standings).sort((a, b) => a.localeCompare(b));
    const team = teams.includes(selectedTeam) ? selectedTeam : teams[0];

    const update = (patch) => {
        prefs.set(patch);
        revalidator.revalidate();
    };
    const toggleFilter = (name) => (e) => setFilter(e.target.checked ? name : "all");

    return (
        <>
            <div className="toolbar">
                <SeasonSelect value={season} onChange={(s) => update({ season: s })} />
                <Form.Select size="sm" className="w-auto" value={leaderboardView} aria-label="Leaderboard"
                             onChange={(e) => update({ leaderboardView: e.target.value })}>
                    <option value="friends">Friends</option>
                    <option value="global">Global</option>
                    <option value="reddit">Reddit</option>
                </Form.Select>
                <RefreshButton refreshing={revalidator.state !== "idle"} onClick={() => revalidator.revalidate()} />
            </div>

            <div className="d-flex flex-wrap column-gap-3 mb-2 small">
                <Form.Check type="checkbox" id="mypicksonly" label="Only games I've picked"
                            checked={effectiveFilter === "mine"} disabled={effectiveFilter === "announcers"}
                            onChange={toggleFilter("mine")} />
                {leaderboardView === "global" && (
                    <Form.Check type="checkbox" id="announcerpicksonly" label="Only games announcers picked"
                                checked={effectiveFilter === "announcers"} disabled={effectiveFilter === "mine"}
                                onChange={toggleFilter("announcers")} />
                )}
            </div>

            {!team ? (
                <p className="text-body-secondary text-center my-5">No picks yet!</p>
            ) : (
                <>
                    <ChipNav items={teams.map((t) => ({ key: t, label: t }))} activeKey={team} onSelect={setSelectedTeam} />
                    <div className="panel p-0 overflow-hidden">
                        <Table hover className="leaderboard mb-0">
                            <thead>
                                <tr>
                                    <th className="rank">#</th>
                                    <th>{leaderboardView === "reddit" ? "Redditor" : "Player"}</th>
                                    <th className="text-end">Picks</th>
                                    <th className="text-end">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings[team].map((row) => (
                                    <tr key={row.key}
                                        className={row.isAnnouncer ? "table-danger" : row.isMe ? "is-me" : undefined}>
                                        <td className="rank">{MEDALS[row.rank - 1] ?? row.rank}</td>
                                        <td>{leaderboardView === "reddit" ? row.redditUsername : row.displayName}</td>
                                        <td className="text-end text-body-secondary">{row.games}</td>
                                        <td className="text-end fw-bold">{row.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </>
            )}
        </>
    );
}
