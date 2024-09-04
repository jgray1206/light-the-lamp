import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from 'axios';
import { useLoaderData } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Swal from 'sweetalert2'

export default function Register() {
    const data = useLoaderData();
    const allTeams = data.data.sort((a, b) => a.teamName.localeCompare(b.teamName)).sort(function (x, y) {
        return x.teamName == "Detroit Red Wings"
            ? -1
            : y.teamName == "Detroit Red Wings"
                ? 1
                : 0;
    });
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [redditUsername, setRedditUsername] = useState("");
    const [teams, setTeams] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password != passwordConfirm) {
            Swal.fire({
                text: "Passwords must match!",
                icon: "error",
                confirmButtonText: "OK",
            });
            return;
        }
        const registerPayload = {
            email: username,
            password: password,
            teams: teams,
            displayName: displayName
        }
        if (redditUsername) {
            registerPayload.redditUsername = redditUsername
        }
        console.log(registerPayload);
        axios.post("/api/user", registerPayload)
            .then(response => {
                Swal.fire({
                    text: "Registration successful! Check your email to confirm your account.",
                    icon: "success",
                    confirmButtonText: "OK",
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate("/login", { replace: true });
                    }
                });
            })
            .catch(err => {
                console.log(err);
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
        `}</style>
            <Container className="p-3 text-center">
                <Card className="shadow">
                    <Card.Body>
                        <img className="mb-4" src="./logo.png" alt="" height="250" />

                        <Form onSubmit={handleSubmit}>
                            <FloatingLabel controlId="floatingInput" label="Email address" className="mb-2">
                                <Form.Control required type="email" placeholder="name@example.com" onChange={(e) => setUsername(e.target.value)} />
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingPassword" label="Password" className="mb-2">
                                <Form.Control required type="password" placeholder="Password" minLength="8" maxLength="50" onChange={(e) => setPassword(e.target.value)} />
                            </FloatingLabel>

                            <FloatingLabel controlId="floatingPasswordConfirm" label="Confirm Password" className="mb-2">
                                <Form.Control required type="password" placeholder="Confirm Password" onChange={(e) => setPasswordConfirm(e.target.value)} />
                            </FloatingLabel>

                            <FloatingLabel controlId="floatingDisplayName" label="Display Name" className="mb-2">
                                <Form.Control required type="text" placeholder="Firstname Lastname" maxLength="18" onChange={(e) => setDisplayName(e.target.value)} />
                            </FloatingLabel>

                            <FloatingLabel controlId="floatingRedditUsername" label="Reddit Username" className="mb-2">
                                <Form.Control type="text" placeholder="Username" maxLength="40" onChange={(e) => setRedditUsername(e.target.value)} />
                            </FloatingLabel>

                            <Form.Label htmlFor="teams">Teams</Form.Label>
                            <Form.Select required aria-label="Teams" id="teams" multiple onChange={e => setTeams([].slice.call(e.target.selectedOptions).map(item => item.value))}>
                                {allTeams.map(function (object) {
                                    return <option key={object.id} value={object.id}>{object.teamName}</option>;
                                })}
                            </Form.Select>
                            <Button variant="primary" size="lg" className="w-100 mt-3" type="submit">Register</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container >
        </>
    );
}