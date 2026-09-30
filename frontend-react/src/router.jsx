import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import api from "./lib/api";
import { getToken, setToken } from "./lib/auth";
import { loadConfig } from "./lib/config";
import { prefs } from "./lib/prefs";
import AppShell from "./components/AppShell";
import ErrorPage from "./components/ErrorPage";
import About from "./components/About";
import Login from "./components/Login";
import Register from "./components/Register";
import PasswordReset from "./components/PasswordReset";
import Picks from "./components/Picks";
import Leaderboard from "./components/Leaderboard";
import Admin from "./components/Admin";
import Announcers from "./components/Announcers";
import Friends from "./components/Friends";
import Profile from "./components/Profile";
import Notifications from "./components/Notifications";

const requireAuth = () => (getToken() ? null : redirect("/login"));
const requireGuest = () => (getToken() ? redirect("/") : null);

// axios drops undefined params, so "self" simply omits pickingAs
const pickingAsParam = () => {
    const { pickingAs } = prefs.get();
    return pickingAs === "self" ? undefined : pickingAs;
};

async function picksLoader() {
    const config = await loadConfig();
    const { season, maxGames } = prefs.get();
    const pickingAs = pickingAsParam();
    const [user, games, myPicks, friendsPicks] = await Promise.all([
        api.get("/api/user", { params: { pickingAs } }),
        api.get("/api/game/user", { params: { season, maxGames } }),
        api.get("/api/pick/user", { params: { season, pickingAs } }),
        api.get("/api/pick/friends", { params: { season, pickingAs } }),
    ]);
    return {
        allowAllPicks: config.allowAllPicks === true,
        user: user.data,
        games: games.data,
        myPicks: myPicks.data,
        friendsPicks: friendsPicks.data,
    };
}

async function leaderboardLoader() {
    await loadConfig();
    const { season, leaderboardView } = prefs.get();
    const url = {
        friends: "/api/pick/friends-and-self",
        reddit: "/api/pick/reddit",
        global: "/api/pick",
    }[leaderboardView];
    const { data } = await api.get(url, { params: { season } });
    return data;
}

async function announcersLoader() {
    await loadConfig();
    const { season, maxGames } = prefs.get();
    const [games, picks, announcers, userCount] = await Promise.all([
        api.get("/api/game/announcers", { params: { season, maxGames } }),
        api.get("/api/pick/announcer", { params: { season } }),
        api.get("/api/announcers"),
        api.get("/api/user/all-count"),
    ]);
    return { games: games.data, picks: picks.data, announcers: announcers.data, userCount: userCount.data };
}

async function profileLoader() {
    const [user, teams] = await Promise.all([
        api.get("/api/user", { params: { profilePic: true } }),
        api.get("/api/teams"),
    ]);
    return { user: user.data, teams: teams.data };
}

const router = createBrowserRouter([
    { path: "/login", element: <Login />, loader: requireGuest, errorElement: <ErrorPage /> },
    {
        path: "/register",
        element: <Register />,
        errorElement: <ErrorPage />,
        loader: async () => requireGuest() ?? (await api.get("/api/teams")).data,
    },
    { path: "/passwordreset", element: <PasswordReset />, loader: requireGuest, errorElement: <ErrorPage /> },
    {
        path: "/logout",
        loader: () => {
            setToken(null);
            return redirect("/login");
        },
    },
    {
        element: <AppShell />,
        errorElement: <ErrorPage />,
        children: [
            {
                errorElement: <ErrorPage />,
                children: [
                    { path: "/about", element: <About /> },
                    {
                        loader: requireAuth,
                        children: [
                            { path: "/", element: <Picks />, loader: picksLoader },
                            { path: "/leaderboard", element: <Leaderboard />, loader: leaderboardLoader },
                            { path: "/announcers", element: <Announcers />, loader: announcersLoader },
                            { path: "/admin", element: <Admin /> },
                            { path: "/profile", element: <Profile />, loader: profileLoader },
                            { path: "/friends", element: <Friends />, loader: async () => (await api.get("/api/user")).data },
                            { path: "/notifications", element: <Notifications /> },
                        ],
                    },
                ],
            },
        ],
    },
    { path: "/index", element: <Navigate to="/" replace /> },
    { path: "*", element: <Navigate to="/" replace /> },
]);

export default router;
