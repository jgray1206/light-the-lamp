import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import About from "./About";
import Register from "./Register";
import Login from "./Login";
import Logout from "./Logout";
import Profile from "./Profile";
import ErrorPage from "./ErrorPage";
import axios from 'axios';
import PasswordReset from "./PasswordReset";

const Routes = () => {
    const { token } = useAuth();

    // Define public routes accessible to all users
    const routesForPublic = [
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
            element: <ProtectedRoute />, // Wrap the component in ProtectedRoute
            children: [
                {
                    path: "/",
                    element: <div>User Home Page</div>,
                },
                {
                    path: "/profile",
                    element: <Profile />,
                },
                {
                    path: "/logout",
                    element: <Logout />,
                },
            ],
        },
    ];

    // Define routes accessible only to non-authenticated users
    const routesForNotAuthenticatedOnly = [
        {
            path: "/login",
            errorElement: <ErrorPage />,
            element: <Login />,
        },
        {
            path: "/passwordreset.html",
            errorElement: <ErrorPage />,
            element: <PasswordReset />,
        },
        {
            path: "/register",
            element: <Register />,
            errorElement: <ErrorPage />,
            loader: async () => { return axios.get("/api/teams") }
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