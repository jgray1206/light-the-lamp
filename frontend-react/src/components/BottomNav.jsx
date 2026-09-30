import { NavLink } from "react-router-dom";
import { MAIN_TABS } from "../lib/navTabs";

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            {MAIN_TABS.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} end className="bottom-nav-link">
                    <Icon size={24} />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
