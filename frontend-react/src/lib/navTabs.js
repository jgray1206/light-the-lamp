import { MdLeaderboard, MdPeople, MdPerson, MdSportsHockey } from "react-icons/md";

// Main sections: a bottom tab bar on phones, links in the header on wider screens
export const MAIN_TABS = [
    { to: "/", label: "Picks", Icon: MdSportsHockey },
    { to: "/leaderboard", label: "Leaderboard", Icon: MdLeaderboard },
    { to: "/friends", label: "Friends", Icon: MdPeople },
    { to: "/profile", label: "Profile", Icon: MdPerson },
];
