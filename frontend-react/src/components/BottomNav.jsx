import { NavLink } from "react-router-dom";
import { MdLeaderboard, MdPeople, MdPerson, MdSportsHockey } from "react-icons/md";

const TABS = [
    { to: "/", label: "Picks", Icon: MdSportsHockey },
    { to: "/leaderboard", label: "Leaderboard", Icon: MdLeaderboard },
    { to: "/friends", label: "Friends", Icon: MdPeople },
    { to: "/profile", label: "Profile", Icon: MdPerson },
];

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            {TABS.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} end className="bottom-nav-link">
                    <Icon size={24} />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
