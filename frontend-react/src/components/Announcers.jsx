import { useMemo, useState } from "react";
import { useLoaderData, useRevalidator } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import api, { showError } from "../lib/api";
import { prefs } from "../lib/prefs";
import { gameLabel, gamesByTeam, groupBy, pickKey } from "../lib/picks";
import ChipNav from "./ChipNav";
import SeasonSelect from "./SeasonSelect";

// Admin page for entering the broadcast announcers' picks
export default function Announcers() {
    const { games: rawGames, picks, announcers, userCount } = useLoaderData();
    const { season, maxGames } = prefs.useStore();
    const revalidator = useRevalidator();
    const [selection, setSelection] = useState({});

    const games = useMemo(() => [...rawGames].sort((a, b) => b.id - a.id), [rawGames]);
    const byTeam = useMemo(() => gamesByTeam(games), [games]);
    const picksByGame = useMemo(() => groupBy(picks, (p) => pickKey(p.game.id, p.team.id)), [picks]);
    const announcersByTeam = useMemo(() => groupBy(announcers, (a) => a.team.id), [announcers]);
    const teams = [...new Map(announcers.map((a) => [a.team.id, a.team])).values()].filter((t) => byTeam[t.id]?.length);

    const team = teams.find((t) => t.id === selection.teamId) ?? teams[0];
    const teamGames = team ? byTeam[team.id] : [];
    const game = teamGames.find((g) => g.id === selection.gameId) ?? teamGames[0];

    const update = (patch) => {
        prefs.set(patch);
        revalidator.revalidate();
    };
    const post = (request) => request.then(() => revalidator.revalidate()).catch(showError);

    return (
        <>
            <div className="toolbar">
                <SeasonSelect value={season} onChange={(s) => update({ season: s })} />
                <span className="ms-auto small text-body-secondary">Active users: {userCount}</span>
            </div>
            {!game ? (
                <p className="text-body-secondary text-center my-5">No games yet!</p>
            ) : (
                <>
                    <ChipNav items={teams.map((t) => ({ key: t.id, label: t.teamName }))} activeKey={team.id}
                             onSelect={(teamId) => setSelection({ teamId })} />
                    <ChipNav
                        size="sm"
                        activeKey={game.id}
                        onSelect={(gameId) => setSelection({ teamId: team.id, gameId })}
                        items={teamGames.map((g) => {
                            const { date, opponent } = gameLabel(g, team);
                            const done = picksByGame[pickKey(g.id, team.id)]?.length === announcersByTeam[team.id].length;
                            return {
                                key: g.id,
                                className: "game-chip " + (done ? "status-done" : "status-open"),
                                label: <><span className="chip-date">{date}</span><span className="chip-opp">{opponent}</span></>,
                            };
                        })}
                    >
                        {teamGames.length === maxGames && (
                            <button type="button" className="chip game-chip load-more" onClick={() => update({ maxGames: maxGames + 20 })}>
                                <span className="chip-date">Load</span><span className="chip-opp">more</span>
                            </button>
                        )}
                    </ChipNav>
                    <div className="panel">
                        <GamePicks key={pickKey(game.id, team.id)} game={game} team={team}
                                   announcers={announcersByTeam[team.id]} picks={picksByGame[pickKey(game.id, team.id)] ?? []}
                                   post={post} />
                    </div>
                </>
            )}
        </>
    );
}

function GamePicks({ game, team, announcers, picks, post }) {
    const options = [
        ...game.players
            .filter((p) => p.team.id === team.id && p.position !== "Goalie")
            .map((p) => p.name)
            .sort(),
        "goalies",
        "team",
    ];
    const params = (announcer, extra) => ({ params: { gameId: game.id, announcerId: announcer.id, ...extra } });

    return (
        <>
            <Button variant="outline-primary" size="sm" className="mb-2"
                    onClick={() => api.post("/api/game/refresh-points", null, { params: { gameId: game.id } }).catch(showError)}>
                Refresh points
            </Button>
            <Table responsive hover className="align-middle">
                <thead>
                    <tr><th>Announcer</th><th>Pick</th><th>Points</th><th>×2</th></tr>
                </thead>
                <tbody>
                    {announcers.map((announcer) => {
                        const pick = picks.find((p) => p.announcer.id === announcer.id);
                        const someoneElseDoubled = picks.some((p) => p.doublePoints && p.announcer.id !== announcer.id);
                        const selected = pick?.theTeam ? "team" : pick?.goalies ? "goalies" : pick?.gamePlayer?.name;
                        return (
                            <tr key={announcer.id}>
                                <td>{announcer.displayName}</td>
                                <td style={{ minWidth: "12rem" }}>
                                    <Typeahead
                                        id={`${game.id}-${announcer.id}`}
                                        options={options}
                                        defaultSelected={selected ? [selected] : undefined}
                                        onChange={([choice]) =>
                                            post(choice
                                                ? api.post("/api/pick/announcer", null, params(announcer, { pick: choice }))
                                                : api.delete("/api/pick/announcer", params(announcer)))
                                        }
                                    />
                                </td>
                                <td>{pick?.points || 0}</td>
                                <td>
                                    <Form.Check
                                        type="checkbox"
                                        id={`${game.id}-${announcer.id}-double`}
                                        aria-label="Double points"
                                        disabled={!pick || someoneElseDoubled}
                                        checked={pick?.doublePoints ?? false}
                                        onChange={(e) =>
                                            post(api.post("/api/pick/announcer", null, params(announcer, { doublePoints: e.target.checked })))
                                        }
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </>
    );
}
