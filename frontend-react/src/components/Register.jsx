import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import api, { alert, showError } from "../lib/api";
import AuthLayout from "./AuthLayout";
import TeamChecklist from "./TeamChecklist";

const FEATURED_TEAM = "Detroit Red Wings";

export default function Register() {
    const rawTeams = useLoaderData();
    const allTeams = [...rawTeams].sort(
        (a, b) => (b.teamName === FEATURED_TEAM) - (a.teamName === FEATURED_TEAM) || a.teamName.localeCompare(b.teamName)
    );
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "", displayName: "", redditUsername: "" });
    const [teams, setTeams] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const field = (name) => ({ value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.passwordConfirm) {
            showError({ message: "Passwords must match!" });
            return;
        }
        if (teams.length === 0) {
            showError({ message: "Pick at least one team to follow." });
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/api/user", {
                email: form.email,
                password: form.password,
                displayName: form.displayName,
                teams,
                ...(form.redditUsername && { redditUsername: form.redditUsername }),
            });
            await alert({ text: "Registration successful! Check your email to confirm your account.", icon: "success" });
            navigate("/login", { replace: true });
        } catch (err) {
            showError(err);
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <Form onSubmit={handleSubmit} className="text-start">
                <FloatingLabel controlId="email" label="Email address" className="mb-2">
                    <Form.Control required type="email" placeholder="name@example.com" autoComplete="email" {...field("email")} />
                </FloatingLabel>
                <FloatingLabel controlId="password" label="Password (8+ characters)" className="mb-2">
                    <Form.Control required type="password" placeholder="Password" minLength={8} maxLength={50}
                                  autoComplete="new-password" {...field("password")} />
                </FloatingLabel>
                <FloatingLabel controlId="passwordConfirm" label="Confirm password" className="mb-2">
                    <Form.Control required type="password" placeholder="Confirm password" autoComplete="new-password"
                                  {...field("passwordConfirm")} />
                </FloatingLabel>
                <FloatingLabel controlId="displayName" label="Display name" className="mb-2">
                    <Form.Control required placeholder="Display name" maxLength={18} {...field("displayName")} />
                </FloatingLabel>
                <FloatingLabel controlId="redditUsername" label="Reddit username (optional)" className="mb-3">
                    <Form.Control placeholder="Reddit username" maxLength={40} {...field("redditUsername")} />
                </FloatingLabel>

                <Form.Label className="fw-medium">Teams to follow</Form.Label>
                <TeamChecklist teams={allTeams} selected={teams} onChange={setTeams} />

                <Button size="lg" className="w-100 mt-3" type="submit" disabled={submitting}>
                    {submitting ? "Creating account…" : "Create account"}
                </Button>
            </Form>
            <p className="mt-3 mb-0 small">Already have an account? <Link to="/login">Log in</Link></p>
        </AuthLayout>
    );
}
