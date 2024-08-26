import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import Header from './Header'
import Footer from './Footer'
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';

export const ProtectedRoute = () => {
    const { token } = useAuth();

    // Check if the user is authenticated
    if (!token) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/login" />;
    }

    // If authenticated, render the child routes
    return <>
        <Header />
        <Container className="p-3">
            <Card className="shadow">
                <Card.Body>
                    <Outlet />
                </Card.Body>
            </Card>
        </Container>
        <Footer />
    </>
};