import { useMemo, useState } from "react";
import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import api, { confirm, showError } from "../lib/api";
import { prefs, GAMES_PAGE_SIZE } from "../lib/prefs";
import { activeGame, buildGameView, gameLabel, gamesByTeam, gameStatus, pickKey, sortGames } from "../lib/picks";
import useProfilePics from "../lib/useProfilePics";
import ChipNav from "./ChipNav";
import GameHeader from "./GameHeader";
import PickRow from "./PickRow";
import RefreshButton from "./RefreshButton";
import SeasonSelect from "./SeasonSelect";

const LOAD_MORE = "load-more";

export default function Picks() {
    const { allowAllPicks, user, games: rawGames, myPicks, friendsPicks } = useLoaderData();
    const { season, maxGames, pickingAs } = prefs.useStore();
    const revalidator = useRevalidator();
    const [hideFriendsPicks, setHideFriendsPicks] = useState(true);
    // What the user tapped; null means "pick the most relevant game for me"
    const [selection, setSelection] = useState(null);

    const games = useMemo(() => sortGames(rawGames), [rawGames]);
    const byTeam = useMemo(() => gamesByTeam(games), [games]);
    const myPicksMap = useMemo(() => new Map(myPicks.map((p) => [pickKey(p.game.id, p.team.id), p])), [myPicks]);
    const teams = useMemo(
        () => [...(user.teams ?? [])].sort((a, b) => a.teamName.localeCompare(b.teamName)).filter((t) => byTeam[t.id]?.length),
        [user.teams, byTeam]
    );
    const kids = user.kids ?? [];

    const pics = useProfilePics([
        ...(user.friends ?? []).flatMap((f) => [f.id, ...(f.kids ?? []).map((k) => k.id)]),
        ...kids.map((k) => k.id),
    ]);

    const updatePrefs = (patch, { resetSelection = true } = {}) => {
        prefs.set(patch);
        if (resetSelection) setSelection(null);
        revalidator.revalidate();
    };

    if (!user.teams?.length) {
        return <Alert variant="info">You haven't joined any teams yet! Pick some on your <Link to="/profile">profile</Link>.</Alert>;
    }

    // Resolve the current team/game, falling back to the live or next upcoming game
    const defaultGame = activeGame(games);
    const team =
        teams.find((t) => t.id === selection?.teamId) ??
        teams.find((t) => t.id === defaultGame?.awayTeam.id || t.id === defaultGame?.homeTeam.id) ??
        teams[0];
    const teamGames = team ? byTeam[team.id] : [];
    const gameIndex = Math.max(
        0,
        teamGames.findIndex((g) => g.id === (selection?.teamId === team?.id && selection.gameId ? selection.gameId : activeGame(teamGames)?.id))
    );
    const game = teamGames[gameIndex];

    const view = game && buildGameView({
        game, team, teamGames, index: gameIndex, myPicksMap, friendsPicks, season, allowAllPicks,
    });
    const showFriends = view && (!view.pickEnabled || !hideFriendsPicks);

    const doPick = async (row) => {
        if (row.onCooldown) {
            showError({ message: `Can't pick ${row.name} again yet — they were picked in one of your previous two games.` });
            return;
        }
        const warning = row.noToi ? `${row.name} had no time on ice last game! ` : "";
        const ok = await confirm(`${warning}Pick ${row.name}? You can't change a pick once it's locked in!`, {
            confirmButtonText: "Lock it in",
            cancelButtonText: "Nope!",
        });
        if (!ok) return;
        try {
            await api.post("/api/pick/user", undefined, {
                params: { gameId: game.id, pick: row.pickValue, teamId: team.id, pickingAs: pickingAs === "self" ? undefined : pickingAs },
            });
            revalidator.revalidate();
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            showError(err);
        }
    };

    const gameChips = teamGames.map((g) => {
        const { date, opponent } = gameLabel(g, team);
        const status = gameStatus(g, myPicksMap.get(pickKey(g.id, team.id)), { allowAllPicks });
        return {
            key: g.id,
            className: `game-chip status-${status}`,
            label: <><span className="chip-date">{date}</span><span className="chip-opp">{opponent}</span></>,
        };
    });

    return (
        <>
            <div className="toolbar">
                <SeasonSelect value={season} onChange={(s) => updatePrefs({ season: s, maxGames: GAMES_PAGE_SIZE })} />
                {kids.length > 0 && (
                    <Form.Select size="sm" className="w-auto" value={pickingAs} aria-label="Picking for"
                                 onChange={(e) => updatePrefs({ pickingAs: e.target.value })}>
                        <option value="self">Picking for me</option>
                        {kids.map((kid) => <option key={kid.id} value={kid.id}>Picking for {kid.displayName}</option>)}
                    </Form.Select>
                )}
                <RefreshButton refreshing={revalidator.state !== "idle"} onClick={() => revalidator.revalidate()} />
            </div>

            {allowAllPicks && (
                <Alert variant="warning" className="py-2 small">
                    <strong>Dev mode:</strong> the server has ALLOW_ALL_PICKS on, so every game without a pick is open.
                </Alert>
            )}

            {pickingAs !== "self" && (
                <Alert variant="info" className="py-2">
                    You're picking for <strong>{kids.find((k) => String(k.id) === String(pickingAs))?.displayName}</strong>!
                </Alert>
            )}

            {!game ? (
                <p className="text-body-secondary text-center my-5">No games yet!</p>
            ) : (
                <>
                    <ChipNav
                        items={teams.map((t) => ({ key: t.id, label: t.teamName }))}
                        activeKey={team.id}
                        onSelect={(teamId) => setSelection({ teamId })}
                    />
                    <ChipNav
                        size="sm"
                        items={gameChips}
                        activeKey={game.id}
                        onSelect={(gameId) => setSelection({ teamId: team.id, gameId })}
                    >
                        {teamGames.length === maxGames && (
                            <button type="button" className="chip game-chip load-more" key={LOAD_MORE}
                                    onClick={() => updatePrefs({ maxGames: maxGames + 20 }, { resetSelection: false })}>
                                <span className="chip-date">Load</span><span className="chip-opp">more</span>
                            </button>
                        )}
                    </ChipNav>

                    <div className="panel">
                        <GameHeader game={game} team={team} status={view.status} />
                        {view.pickEnabled && (
                            <Form.Check type="switch" id="hideFriendsPicks" className="small mb-2"
                                        label="Hide friends' picks while picking"
                                        checked={hideFriendsPicks}
                                        onChange={(e) => setHideFriendsPicks(e.target.checked)} />
                        )}
                        <div className="pick-list">
                            {view.rows.map((row) => (
                                <PickRow key={row.key} row={row} game={game} team={team}
                                         pickEnabled={view.pickEnabled} showFriends={showFriends} pics={pics}
                                         onPick={() => doPick(row)} />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
