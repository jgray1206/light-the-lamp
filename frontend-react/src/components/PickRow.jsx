import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import { MdMic } from "react-icons/md";
import { teamLogoUrl } from "../lib/picks";
import { useTheme } from "../lib/theme";

const fallbackToShrug = ({ currentTarget }) => {
    currentTarget.onerror = null;
    currentTarget.src = "/shrug.png";
};

export default function PickRow({ row, game, team, pickEnabled, showFriends, pics, onPick }) {
    const { theme } = useTheme();
    const logo = row.key === "team" && teamLogoUrl(game, team, theme);
    const warnNoToi = pickEnabled && row.noToi;

    let className = "pick-row";
    if (row.picked) className += " is-picked";
    else if (warnNoToi) className += " is-no-toi";

    return (
        <div className={className}>
            <div className="pick-avatars">
                {logo ? (
                    <img src={logo} alt="" className="pick-logo" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                ) : (
                    row.imgs.map((src) => (
                        <img key={src} src={src} alt="" width="56" height="56" loading="lazy" className="pick-avatar"
                             onError={fallbackToShrug} />
                    ))
                )}
            </div>

            <div className="pick-main">
                <div className="pick-name">
                    {row.name}
                    {row.position && <span className="pick-pos">{row.position}</span>}
                </div>
                <div className="pick-meta">
                    {(pickEnabled ? row.hints : row.stats).join(" · ") || "—"}
                </div>
                {(row.picked || (pickEnabled && (row.onCooldown || row.noToi))) && (
                    <div className="d-flex flex-wrap gap-1 mt-1">
                        {row.picked && <Badge bg="danger">Your pick</Badge>}
                        {pickEnabled && row.onCooldown && <Badge bg="secondary">On cooldown</Badge>}
                        {warnNoToi && <Badge bg="warning" text="dark">No TOI last game</Badge>}
                    </div>
                )}
                {showFriends && row.friends.length > 0 && (
                    <div className="pick-friends">
                        {row.friends.map((f) => (
                            <span key={f.id ?? f.name} className={"friend-chip" + (f.id ? "" : " is-announcer")}>
                                {f.id ? <img src={pics.get(f.id) ?? "/shrug.png"} alt="" /> : <MdMic />}
                                {f.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="pick-side">
                {pickEnabled ? (
                    <Button variant={row.onCooldown ? "outline-secondary" : "primary"} onClick={onPick}>Pick</Button>
                ) : (
                    <div className="pick-points">
                        {row.points}
                        <small>pts</small>
                    </div>
                )}
            </div>
        </div>
    );
}
