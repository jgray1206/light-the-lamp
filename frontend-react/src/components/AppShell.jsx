import { Outlet, useNavigation, useRevalidator } from "react-router-dom";
import Container from "react-bootstrap/Container";
import { useAuth } from "../lib/auth";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function AppShell() {
    const { token } = useAuth();
    const navigation = useNavigation();
    const revalidator = useRevalidator();
    const loading = navigation.state === "loading" || revalidator.state === "loading";

    return (
        <>
            <Header />
            {loading && <div className="loading-bar" aria-hidden="true" />}
            <Container as="main" className={"app-main" + (token ? " has-bottom-nav" : "")}>
                <Outlet />
            </Container>
            {token && <BottomNav />}
        </>
    );
}
