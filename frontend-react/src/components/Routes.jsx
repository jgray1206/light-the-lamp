import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../provider/authProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import About from "./About";
import Register from "./Register";
import Login from "./Login";
import Friends from "./Friends";
import Logout from "./Logout";
import Profile from "./Profile";
import ErrorPage from "./ErrorPage";
import AxiosInstance from "../provider/axiosProvider";
import PasswordReset from "./PasswordReset";
import Leaderboard from "./Leaderboard";
import Picks from "./Picks";
import Announcers from "./Announcers";

const Routes = () => {
    const { token } = useAuth();
    const [season, setSeason] = useState("202401");
    const [maxGames, setMaxGames] = useState(5);
    const [leaderboardTab, setLeaderboardTab] = useState("friends");

    // Define public routes accessible to all users
    const routesForPublic = [
        {
            path: "/login",
            errorElement: <ErrorPage />,
            element: <Login />,
        },
        {
            path: "/about",
            errorElement: <ErrorPage />,
            element: <About />
        }
    ];

    // Define routes accessible only to authenticated users
    const routesForAuthenticatedOnly = [
        {
            path: "/",
            errorElement: <ErrorPage />,
            element: <ProtectedRoute />,
            children: [
                {
                    path: "/",
                    element: <Picks setSeason={setSeason} getSeason={season} maxGames={maxGames} setMaxGames={setMaxGames} />,
                    loader: async () => {
                        const [user, games, myPicks, friendsPicks] = await Promise.all([
                            AxiosInstance.get("/api/user"),
                            AxiosInstance.get("/api/game/user?season=" + season + "&maxGames=" + maxGames),
                            AxiosInstance.get("/api/pick/user?season=" + season),
                            AxiosInstance.get("/api/pick/friends?season=" + season),
                        ]);
                        return { user, games, myPicks, friendsPicks };
                    }
                },
                {
                    path: "/index",
                    element: <Navigate to="/" replace />
                },
                {
                    path: "/announcers",
                    element: <Announcers setSeason={setSeason} getSeason={season} maxGames={maxGames} setMaxGames={setMaxGames} />,
                    loader: async () => {
                        const [games, picks, announcers, userCount] = await Promise.all([
                            AxiosInstance.get("/api/game/announcers?season=" + season + "&maxGames=" + maxGames),
                            AxiosInstance.get("/api/pick/announcer?season=" + season),
                            AxiosInstance.get("/api/announcers"),
                            AxiosInstance.get("/api/user/all-count")
                        ]);
                        return { games, picks, announcers, userCount };
                    }
                },
                {
                    path: "/profile",
                    element: <Profile />,
                    loader: async () => {
                        const [user, teams] = await Promise.all([
                            AxiosInstance.get("/api/user?profilePic=true"),
                            AxiosInstance.get("/api/teams")
                        ]);
                        return { user, teams };
                    }
                },
                {
                    path: "/friends",
                    element: <Friends />,
                    loader: async () => { return AxiosInstance.get("/api/user") }
                },
                {
                    path: "/logout",
                    element: <Logout />,
                },
                {
                    path: "/leaderboard",
                    element: <Leaderboard setSeason={setSeason}
                        getSeason={season}
                        leaderboardTab={leaderboardTab}
                        setLeaderboardTab={setLeaderboardTab} />,
                    loader: async () => {
                        if (leaderboardTab == "friends") {
                            return AxiosInstance.get("/api/pick/friends-and-self?season=" + season);
                        } else if (leaderboardTab == "reddit") {
                            return AxiosInstance.get("/api/pick/reddit?season=" + season);
                        } else {
                            return AxiosInstance.get("/api/pick?season=" + season);
                        }
                    }
                }
            ],
        },
    ];

    // Define routes accessible only to non-authenticated users
    const routesForNotAuthenticatedOnly = [
        {
            path: "/passwordreset",
            errorElement: <ErrorPage />,
            element: <PasswordReset />,
        },
        {
            path: "/register",
            element: <Register />,
            errorElement: <ErrorPage />,
            loader: async () => { return AxiosInstance.get("/api/teams") }
        }
    ];

    // Combine and conditionally include routes based on authentication status
    const router = createBrowserRouter([
        ...routesForPublic,
        ...(!token ? routesForNotAuthenticatedOnly : []),
        ...routesForAuthenticatedOnly,
    ]);

    // Provide the router configuration using RouterProvider
    return <RouterProvider router={router} />;
};

export default Routes;