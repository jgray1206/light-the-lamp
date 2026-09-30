import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import api, { alert, showError } from "../lib/api";
import AuthLayout from "./AuthLayout";

export default function PasswordReset() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            showError({ message: "Passwords must match!" });
            return;
        }
        try {
            await api.put("/api/passwordreset", undefined, { params: { password, uuid: searchParams.get("resetUuid") } });
            await alert({ text: "Password reset! Please log in with your new password.", icon: "success" });
            navigate("/login", { replace: true });
        } catch (err) {
            showError(err);
        }
    };

    return (
        <AuthLayout>
            <h1 className="h5 mb-3">Choose a new password</h1>
            <Form onSubmit={handleSubmit}>
                <FloatingLabel controlId="password" label="New password" className="mb-2">
                    <Form.Control required type="password" placeholder="New password" minLength={8} maxLength={50}
                                  autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
                </FloatingLabel>
                <FloatingLabel controlId="passwordConfirm" label="Confirm new password" className="mb-2">
                    <Form.Control required type="password" placeholder="Confirm new password" autoComplete="new-password"
                                  onChange={(e) => setPasswordConfirm(e.target.value)} />
                </FloatingLabel>
                <Button size="lg" className="w-100 mt-2" type="submit">Reset password</Button>
            </Form>
        </AuthLayout>
    );
}
