import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import api, { showError, showSuccess } from "../lib/api";
import { setToken } from "../lib/auth";
import AuthLayout from "./AuthLayout";

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const confirmationUuid = searchParams.get("confirmation");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Arriving from the account confirmation email
    const confirmed = useRef(false);
    useEffect(() => {
        if (!confirmationUuid || confirmed.current) return;
        confirmed.current = true;
        api.get(`/api/user/confirm/${confirmationUuid}`)
            .then(() => showSuccess("Account confirmed! Please log in."))
            .catch(showError);
    }, [confirmationUuid]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await api.post("/api/login", { username: email, password });
            setToken(data.access_token);
            navigate("/", { replace: true });
        } catch (err) {
            showError(err);
            setSubmitting(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            showError({ message: "Enter your email address above first, then tap \"Forgot password?\" again." });
            return;
        }
        try {
            await api.post("/api/passwordreset", null, { params: { email } });
            showSuccess("Password reset email sent! Click the link in it to reset your password. If you don't see it, check your spam.");
        } catch (err) {
            showError(err);
        }
    };

    return (
        <AuthLayout>
            <Form onSubmit={handleSubmit}>
                <FloatingLabel controlId="email" label="Email address" className="mb-2">
                    <Form.Control type="email" placeholder="name@example.com" autoComplete="email" required
                                  value={email} onChange={(e) => setEmail(e.target.value)} />
                </FloatingLabel>
                <FloatingLabel controlId="password" label="Password">
                    <Form.Control type="password" placeholder="Password" autoComplete="current-password" required
                                  onChange={(e) => setPassword(e.target.value)} />
                </FloatingLabel>
                <Button size="lg" className="w-100 mt-3" type="submit" disabled={submitting}>
                    {submitting ? "Logging in…" : "Log in"}
                </Button>
                <Button variant="link" size="sm" className="mt-1" onClick={handlePasswordReset}>Forgot password?</Button>
            </Form>
            <hr />
            <p className="mb-2 text-body-secondary">New here?</p>
            <Button as={Link} to="/register" variant="outline-primary" className="w-100">Create an account</Button>
        </AuthLayout>
    );
}
