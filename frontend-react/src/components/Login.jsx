import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import { useState } from "react";
import axios from 'axios';
import { Link } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Swal from 'sweetalert2'

export default function Login() {
    const { setToken } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handlePasswordReset = async () => {
        axios.post("/api/passwordreset?email=" + username)
            .then(response => {
                Swal.fire({
                    text: "Password reset email sent! Check your email and click the link. If you don't find the email, do check your spam.",
                    icon: "success",
                    confirmButtonText: "OK",
                });
            })
            .catch(err => {
                Swal.fire({
                    text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                    icon: "error",
                    confirmButtonText: "OK",
                });
            });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const loginPayload = {
            username: username,
            password: password
        }

        axios.post("/api/login", loginPayload)
            .then(response => {
                console.log(response);
                const token = response.data.access_token;
                setToken(token);
                navigate("/", { replace: true });
            })
            .catch(err => {
                Swal.fire({
                    text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                    icon: "error",
                    confirmButtonText: "OK",
                });
            });
    };

    return (
        <>
            <style type="text/css">
                {`
                body {
                    background-color: #f5f5f5;
                }

                .card {
                    border-radius: 1rem;
                    max-width: 25rem;
                    margin: auto;
                }

                #help {
                    text-decoration: none;
                    color: black;
                    display: flex;
                    justify-content: flex-end;
                    margin-left: auto;
                    margin-right: 10px;
                }
        `}</style>
            <Container className="p-3 text-center">
                <Card className="shadow">
                    <Card.Body>
                        <div>
                            <Link to="/about" id="help">
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                    viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                    <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
                                </svg>
                            </Link>
                        </div>
                        <img className="mb-4" src="./logo.png" alt="" height="250" />
                        <Form onSubmit={handleSubmit}>
                            <FloatingLabel
                                controlId="floatingInput"
                                label="Email address"
                                className="mb-2"
                            >
                                <Form.Control type="email" placeholder="name@example.com" onChange={(e) => setUsername(e.target.value)} />
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingPassword" label="Password">
                                <Form.Control type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                            </FloatingLabel>
                            <Button variant="secondary" size="lg" className="w-100 mt-3" type="submit">Login</Button>
                            <Link to="/register">
                                <Button variant="primary" size="lg" className="w-100 mt-3" id="register">Click Here To Register</Button>
                            </Link>
                            <Button variant="none" size="sm" className="w-100 mt-3" id="forgotpassword" onClick={handlePasswordReset}>Forgot Password?</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
}