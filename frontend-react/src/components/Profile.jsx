import { useState } from "react";
import AxiosInstance from '../provider/axiosProvider';
import { useLoaderData } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Button from 'react-bootstrap/Button';
import Swal from 'sweetalert2'

export default function Profile() {
    const response = useLoaderData();
    const user = response.user.data;
    const allTeams = response.teams.data.sort((a, b) => a.teamName.localeCompare(b.teamName));

    let profilePicBytesInit = "/shrug.png"
    if (user.profilePic) {
        profilePicBytesInit = "data:image/png;base64," + user.profilePic;
    }

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [displayName, setDisplayName] = useState(user.displayName);
    const [redditUsername, setRedditUsername] = useState(user.redditUsername);
    const [teams, setTeams] = useState(user.teams?.map((it) => it.id));
    const [profilePic, setProfilePic] = useState("");
    const [profilePicBytes, setProfilePicBytes] = useState(profilePicBytesInit);

    const handleChange = (event) => {
        const selectedValues = Array.from(event.target.selectedOptions, option => option.value);
        setTeams(selectedValues);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password && password != passwordConfirm) {
            Swal.fire({
                text: "Passwords must match!",
                icon: "error",
                confirmButtonText: "OK",
            });
            return;
        }
        let formData = new FormData();
        if (profilePic) {
            formData.set("profilePic", profilePic);
        }
        if (displayName) {
            formData.set("displayName", displayName);
        }
        if (redditUsername) {
            formData.set("redditUsername", redditUsername);
        } else {
            formData.set("redditUsername", "");
        }
        if (password) {
            formData.set("password", password);
        }
        formData.set("teams", teams);

        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };
        AxiosInstance.put("/api/user", formData, config)
            .then(response => {
                Swal.fire({
                    text: "User update successful!",
                    icon: "success",
                    confirmButtonText: "OK",
                });
            })
            .catch(err => {
                console.log(err);
                if (err.status == 413) {
                    Swal.fire({
                        text: "Picture is too large! Please select a picture smaller than 1MB.",
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                } else {
                    Swal.fire({
                        text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                }
            });
    };

    return (
        <>
            <img width="150" height="150" className="img-thumbnail mb-3" src={profilePicBytes} />
            <Form onSubmit={handleSubmit}>

                <FloatingLabel controlId="floatingDisplayName" label="Display Name" className="mb-2">
                    <Form.Control required type="text" placeholder="Firstname Lastname" maxLength="18" onChange={(e) => setDisplayName(e.target.value)} value={displayName} />
                </FloatingLabel>

                <FloatingLabel controlId="floatingProfilePic" label="Profile Pic" className="mb-2">
                    <Form.Control type="file" placeholder="Firstname Lastname" onChange={(e) => {
                        setProfilePic(e.target.files[0]);
                        setProfilePicBytes(URL.createObjectURL(e.target.files[0]));
                    }} />
                </FloatingLabel>

                <Form.Label htmlFor="teams">Teams</Form.Label>
                <Form.Select className="mb-2" aria-label="Teams" id="teams" required multiple onChange={handleChange} value={teams}>
                    {allTeams.map(function (object) {
                        return <option key={object.id} value={object.id}>{object.teamName}</option>;
                    })}
                </Form.Select>

                <FloatingLabel controlId="floatingRedditUsername" label="Reddit Username" className="mb-3">
                    <Form.Control type="text" placeholder="Username" maxLength="40" onChange={(e) => setRedditUsername(e.target.value)} value={redditUsername} />
                </FloatingLabel>

                <FloatingLabel controlId="floatingPassword" label="New Password" className="mb-1">
                    <Form.Control type="password" placeholder="Password" minLength="8" maxLength="50" onChange={(e) => setPassword(e.target.value)} />
                </FloatingLabel>

                <FloatingLabel controlId="floatingPasswordConfirm" label="Confirm New Password" className="mb-2">
                    <Form.Control type="password" placeholder="Confirm Password" onChange={(e) => setPasswordConfirm(e.target.value)} />
                </FloatingLabel>

                <Button variant="primary" size="lg" className="w-100 mt-3" type="submit">Update</Button>
            </Form>
        </>
    );
}