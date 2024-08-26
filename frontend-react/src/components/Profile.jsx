import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from 'axios';
import { Link, useSearchParams } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Swal from 'sweetalert2'

export default function Profile() {
    let [searchParams, setSearchParams] = useSearchParams();
    const resetUuid = searchParams.get("resetUuid");
    const navigate = useNavigate();
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [password, setPassword] = useState("");

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
        axios.put("/api/passwordreset?password=" + password + "&uuid=" + resetUuid)
            .then(response => {
                Swal.fire({
                    text: "Password reset successfully! Please login now.",
                    icon: "success",
                    confirmButtonText: "OK",
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate("/login", { replace: true });
                    }
                });
            })
            .catch(err => {
                Swal.fire({
                    text: err["response"]["data"]["_embedded"]["errors"][0]["message"] || err["message"],
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
            <img width="150" height="150" class="img-thumbnail mb-3" src="" id="profilePicPreview" />
            <form name="userUpdate">
                <div class="mb-3">
                    <label for="displayName" class="form-label">Display Name</label>
                    <input required type="text" class="form-control" id="displayName" name="displayName"
                        placeholder="Firstname Lastname" maxlength="18" />
                </div>
                <div class="mb-3">
                    <label for="profilePic" class="form-label">Profile Pic</label>
                    <input class="form-control" type="file" id="profilePic" name="profilePic" />
                </div>
                <div class="mb-3">
                    <label for="teams" class="form-label">Teams</label>
                    <select class="form-select" id="teams" multiple>

                    </select>
                </div>
                <div class="mb-3">
                    <label for="redditUsername" class="form-label">Reddit Username</label>
                    <input type="text" class="form-control" id="redditUsername" name="redditUsername"
                        placeholder="Reddit Username" maxlength="40" autocomplete="off" />
                </div>
                <div class="form-floating">
                    <input type="password" class="form-control" id="password" placeholder="New Password" name="pass1"
                        autocomplete="new-password" minlength="8" maxlength="50" />
                    <label for="password" class="form-label">New Password</label>
                </div>
                <div class="form-floating">
                    <input type="password" class="form-control" id="confirm-password" placeholder="Confirm New Password"
                        name="pass2" autocomplete="new-password" />
                    <label for="confirm-password" class="form-label">Confirm New Password</label>
                </div>
                <button class="w-100 btn btn-lg btn-primary mt-3" type="submit">Update</button>
            </form>
        </>
    );
}