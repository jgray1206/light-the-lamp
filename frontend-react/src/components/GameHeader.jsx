import Badge from "react-bootstrap/Badge";
import { gameStart } from "../lib/picks";

const STATUS = {
    open: { bg: "success", text: "Open for picks" },
    picked: { bg: "danger", text: "Pick locked in" },
    locked: { bg: "secondary", text: "Picks closed" },
    done: { bg: "secondary", text: "Final" },
};

export default function GameHeader({ game, team, status }) {
    const start = gameStart(game);
    const away = game.awayTeam.id === team.id;
    const opponent = away ? game.homeTeam : game.awayTeam;
    const showScore = game.gameState !== "Preview" && game.homeTeamGoals != null;
    const { bg, text } = STATUS[status];

    return (
        <div className="game-header">
            <div>
                <div className="game-title">{away ? "@" : "vs"} {opponent.teamName}</div>
                <div className="game-time">
                    {start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    {" · "}
                    {start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    {game.gameState === "Live" && <span className="live-dot">Live</span>}
                </div>
            </div>
            <div className="text-end">
                {showScore && (
                    <div className="game-score">
                        {game.awayTeam.abbreviation} {game.awayTeamGoals ?? 0} – {game.homeTeamGoals ?? 0} {game.homeTeam.abbreviation}
                    </div>
                )}
                <Badge bg={bg}>{text}</Badge>
            </div>
        </div>
    );
}
