import { Fragment, useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Swal from "sweetalert2";
import api, { alert, fallbackToNoPic, picDataUrl, showError, showSuccess } from "../lib/api";
import { useAuth } from "../lib/auth";
import { gameLabel, gameStart, pickKey } from "../lib/picks";
import { prefs } from "../lib/prefs";
import ChipNav from "./ChipNav";
import SeasonSelect from "./SeasonSelect";

// Admin tools: find users, eyeball their profile pics, and fix goofed picks.
// The server enforces the admin role and that every change is a legal pick; this page is just a crude UI.

const describePick = (pick) =>
    !pick ? null : pick.goalies ? "goalies" : pick.theTeam ? "team" : pick.gamePlayer?.name ?? "?";

// Swal prompt that only confirms once the admin types the given word
async function confirmTyped(word, html) {
    const result = await alert({
        icon: "warning",
        title: "Are you sure?",
        html,
        input: "text",
        inputPlaceholder: `Type ${word} to confirm`,
        showCancelButton: true,
        confirmButtonText: `Yes, ${word.toLowerCase()} it`,
        confirmButtonColor: "#dc3545",
        cancelButtonText: "Cancel",
        focusCancel: true,
        preConfirm: (value) => {
            if (value?.trim().toUpperCase() !== word) {
                Swal.showValidationMessage(`Type ${word} to confirm`);
                return false;
            }
            return true;
        },
    });
    return result.isConfirmed;
}

export default function Admin() {
    const { isAdmin } = useAuth();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [userId, setUserId] = useState(null);

    // Search as you type (debounced)
    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            return;
        }
        const timer = setTimeout(() => {
            api.get("/api/admin/users", { params: { q } }).then(({ data }) => setResults(data)).catch(showError);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    if (!isAdmin) return <Alert variant="danger">Admins only.</Alert>;

    return (
        <>
            <div className="panel">
                <h1 className="h5">Find a user</h1>
                <Form.Control autoFocus placeholder="Search by email or display name" value={query}
                              onChange={(e) => setQuery(e.target.value)} />
                {results.length > 0 && (
                    <ul className="list-unstyled mb-0 mt-2 admin-results">
                        {results.map((u) => (
                            <li key={u.id}>
                                <button type="button" className={"admin-result" + (u.id === userId ? " active" : "")}
                                        onClick={() => setUserId(u.id)}>
                                    <span className="fw-medium">{u.displayName || "(no name)"}</span>
                                    <span className="text-body-secondary small">{u.email ?? ""}</span>
                                    <span className="d-flex gap-1 ms-auto">
                                        {u.parentId && <Badge bg="info">kid</Badge>}
                                        {u.hasPic && <Badge bg="secondary">pic</Badge>}
                                        {!u.confirmed && !u.parentId && <Badge bg="warning" text="dark">unconfirmed</Badge>}
                                        {u.locked && <Badge bg="danger">locked</Badge>}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {query.trim().length >= 2 && results.length === 0 && (
                    <p className="small text-body-secondary mt-2 mb-0">No matches.</p>
                )}
            </div>

            {userId && <UserAdmin key={userId} userId={userId} onSelectUser={setUserId} />}
        </>
    );
}

function UserAdmin({ userId, onSelectUser }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        api.get(`/api/admin/users/${userId}`).then(({ data }) => setUser(data)).catch(showError);
    }, [userId]);

    if (!user) return <div className="panel text-body-secondary">Loading…</div>;

    return (
        <>
            <div className="panel">
                <div className="d-flex flex-wrap gap-3 align-items-start">
                    <a href={picDataUrl(user.profilePic)} target="_blank" rel="noopener" title="Open full size">
                        <img src={picDataUrl(user.profilePic)} alt="" className="admin-pic" onError={fallbackToNoPic} />
                    </a>
                    <div className="small">
                        <h2 className="h5 mb-1">{user.displayName || "(no name)"}</h2>
                        <div>{user.email ?? <em>no email (kid account)</em>}</div>
                        {user.redditUsername && <div>Reddit: {user.redditUsername}</div>}
                        <div className="text-body-secondary">User #{user.id}</div>
                        <div className="d-flex gap-1 mt-1">
                            {!user.profilePic && <Badge bg="secondary">no pic</Badge>}
                            {user.confirmed === false && <Badge bg="warning" text="dark">unconfirmed</Badge>}
                            {user.locked && <Badge bg="danger">locked</Badge>}
                        </div>
                        {user.parent && (
                            <div className="mt-2">
                                Kid of{" "}
                                <Button variant="link" size="sm" className="p-0 align-baseline" onClick={() => onSelectUser(user.parent.id)}>
                                    {user.parent.displayName} ({user.parent.email})
                                </Button>
                            </div>
                        )}
                        {user.kids?.length > 0 && (
                            <div className="mt-2">
                                Kids:{" "}
                                {user.kids.map((k) => (
                                    <Button key={k.id} variant="link" size="sm" className="p-0 me-2 align-baseline"
                                            onClick={() => onSelectUser(k.id)}>
                                        {k.displayName}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {user.teams?.length ? (
                <UserPicks user={user} />
            ) : (
                <Alert variant="info">This user has no teams, so they have no picks to fix.</Alert>
            )}
        </>
    );
}

function UserPicks({ user }) {
    const [season, setSeason] = useState(prefs.get().season);
    const [teamId, setTeamId] = useState(user.teams[0].id);
    const [games, setGames] = useState(null);
    const [picks, setPicks] = useState([]);
    const [editing, setEditing] = useState(null); // game id
    const team = user.teams.find((t) => t.id === teamId);

    const loadPicks = () =>
        api.get(`/api/admin/users/${user.id}/picks`, { params: { season } })
            .then(({ data }) => setPicks(data))
            .catch(showError);

    useEffect(() => {
        setGames(null);
        setEditing(null);
        api.get("/api/admin/games", { params: { teamId, season } })
            .then(({ data }) => setGames([...data].sort((a, b) => gameStart(b) - gameStart(a))))
            .catch(showError);
        loadPicks();
    }, [teamId, season]);

    const picksByGame = useMemo(
        () => new Map(picks.filter((p) => p.team?.id === teamId).map((p) => [p.game?.id, p])),
        [picks, teamId]
    );

    return (
        <div className="panel">
            <div className="toolbar">
                <h2 className="h5 mb-0 me-auto">Picks</h2>
                <SeasonSelect value={season} onChange={setSeason} />
            </div>
            <ChipNav items={user.teams.map((t) => ({ key: t.id, label: t.teamName }))} activeKey={teamId} onSelect={setTeamId} />

            {!games ? (
                <p className="text-body-secondary">Loading games…</p>
            ) : games.length === 0 ? (
                <p className="text-body-secondary">No games this season.</p>
            ) : (
                <Table size="sm" hover responsive className="align-middle admin-picks">
                    <thead>
                        <tr><th>Date</th><th>Game</th><th>Pick</th><th className="text-end">Pts</th><th /></tr>
                    </thead>
                    <tbody>
                        {games.map((game, index) => {
                            const pick = picksByGame.get(game.id);
                            const { opponent } = gameLabel(game, team);
                            const start = gameStart(game);
                            return (
                                <Fragment key={pickKey(game.id, teamId)}>
                                    <tr className={editing === game.id ? "table-active" : undefined}>
                                        <td className="text-nowrap">{start.toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}</td>
                                        <td className="text-nowrap">{opponent} <span className="text-body-secondary small">{game.gameState}</span></td>
                                        <td>{describePick(pick) ?? <span className="text-body-secondary">—</span>}</td>
                                        <td className="text-end">{pick?.points ?? ""}</td>
                                        <td className="text-end">
                                            <Button size="sm" variant={editing === game.id ? "secondary" : "outline-secondary"}
                                                    onClick={() => setEditing(editing === game.id ? null : game.id)}>
                                                {editing === game.id ? "Close" : "Edit"}
                                            </Button>
                                        </td>
                                    </tr>
                                    {editing === game.id && (
                                        <tr>
                                            <td colSpan={5}>
                                                <EditPick
                                                    user={user}
                                                    team={team}
                                                    game={game}
                                                    pick={pick}
                                                    // Picks in the two games on either side (games are newest first)
                                                    neighborPicks={[index - 2, index - 1, index + 1, index + 2]
                                                        .map((i) => games[i] && picksByGame.get(games[i].id))
                                                        .filter(Boolean)}
                                                    onDone={() => {
                                                        setEditing(null);
                                                        loadPicks();
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

function EditPick({ user, team, game, pick, neighborPicks, onDone }) {
    const current = describePick(pick);
    const onCooldown = new Set(neighborPicks.map(describePick));
    const players = game.players
        .filter((p) => p.team?.id === team.id && p.position !== "Goalie")
        .sort((a, b) => a.name.localeCompare(b.name));
    const [choice, setChoice] = useState("");
    const [saving, setSaving] = useState(false);

    const who = `<b>${user.displayName}</b>${user.email ? ` (${user.email})` : ""}`;
    const gameText = `${gameLabel(game, team).opponent} on ${gameStart(game).toLocaleDateString()}`;
    const params = { gameId: game.id, teamId: team.id };

    const save = async () => {
        const ok = await confirmTyped(
            "CHANGE",
            `You're about to <b>overwrite another user's pick</b>.<br><br>` +
            `${who}<br>${team.teamName}, ${gameText}<br><br>` +
            `<b>${current ?? "(no pick)"}</b> → <b>${choice}</b><br><br>` +
            `Their points for this game will be recalculated. This is logged.`
        );
        if (!ok) return;
        setSaving(true);
        try {
            await api.put(`/api/admin/users/${user.id}/picks`, undefined, { params: { ...params, pick: choice } });
            showSuccess(`Pick changed to ${choice}.`);
            onDone();
        } catch (err) {
            showError(err);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        const ok = await confirmTyped(
            "DELETE",
            `You're about to <b>delete another user's pick</b>.<br><br>` +
            `${who}<br>${team.teamName}, ${gameText}<br><br>Pick: <b>${current}</b><br><br>This is logged.`
        );
        if (!ok) return;
        setSaving(true);
        try {
            await api.delete(`/api/admin/users/${user.id}/picks`, { params });
            showSuccess("Pick deleted.");
            onDone();
        } catch (err) {
            showError(err);
        } finally {
            setSaving(false);
        }
    };

    const option = (value, label) => (
        <option key={value} value={value} disabled={value === current || onCooldown.has(value)}>
            {label}{value === current ? " (current pick)" : onCooldown.has(value) ? " (cooldown)" : ""}
        </option>
    );

    return (
        <div className="d-flex flex-wrap gap-2 align-items-center py-1">
            <Form.Select size="sm" className="w-auto" value={choice} onChange={(e) => setChoice(e.target.value)}
                         aria-label="New pick">
                <option value="">Choose a new pick…</option>
                {players.map((p) => option(p.name, `${p.name} (${p.position === "Defenseman" ? "D" : "F"})`))}
                {option("goalies", "The goalies")}
                {option("team", "The team")}
            </Form.Select>
            <Button size="sm" variant="danger" disabled={!choice || saving} onClick={save}>Change pick</Button>
            {pick && <Button size="sm" variant="outline-danger" disabled={saving} onClick={remove}>Delete pick</Button>}
            {players.length === 0 && <span className="small text-body-secondary">No players synced for this game yet.</span>}
        </div>
    );
}
