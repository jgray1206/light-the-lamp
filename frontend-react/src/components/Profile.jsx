import {useRef, useState} from "react";
import AxiosInstance from '../provider/axiosProvider';
import {useLoaderData} from "react-router-dom";
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Button from 'react-bootstrap/Button';
import Swal from 'sweetalert2';

export default function Profile() {
    const response = useLoaderData();
    const user = response.user.data;
    const allTeams = response.teams.data.sort((a, b) => a.teamName.localeCompare(b.teamName));

    // ---------------------------
    // USER PROFILE & DISPLAY DATA
    // ---------------------------
    const profilePicBytesInit = user.profilePic ? "data:image/png;base64," + user.profilePic : "/shrug.png";

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [displayName, setDisplayName] = useState(user.displayName);
    const [redditUsername, setRedditUsername] = useState(user.redditUsername);
    const [teams, setTeams] = useState(user.teams?.map(it => it.id));
    const [profilePic, setProfilePic] = useState("");
    const [profilePicBytes, setProfilePicBytes] = useState(profilePicBytesInit);

    // ---------------------------
    // KIDS SECTION STATE
    // ---------------------------
    const [kids, setKids] = useState(user.kids || []);
    const [newKidName, setNewKidName] = useState("");
    const [newKidPic, setNewKidPic] = useState(null);
    const [newKidPicPreview, setNewKidPicPreview] = useState("/shrug.png");
    const newKidPicInputRef = useRef(null);
    const [showAddKidForm, setShowAddKidForm] = useState(false);

    // ---------------------------
    // TEAM SELECTION HANDLER
    // ---------------------------
    const handleChange = (event) => {
        const selectedValues = Array.from(event.target.selectedOptions, option => option.value);
        setTeams(selectedValues);
    };

    // ---------------------------
    // USER UPDATE
    // ---------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password && password !== passwordConfirm) {
            Swal.fire({text: "Passwords must match!", icon: "error"});
            return;
        }

        let formData = new FormData();
        if (profilePic) formData.set("profilePic", profilePic);
        formData.set("displayName", displayName);
        formData.set("redditUsername", redditUsername || "");
        if (password) formData.set("password", password);
        formData.set("teams", teams);

        const config = {headers: {'content-type': 'multipart/form-data'}};

        AxiosInstance.put("/api/user", formData, config)
            .then(() => Swal.fire({text: "User update successful!", icon: "success"}))
            .catch(err => {
                Swal.fire({text: err?.response?.data?.message || "Error updating user.", icon: "error"});
            });
    };

    // ---------------------------
    // CREATE KID
    // ---------------------------
    const handleCreateKid = async () => {
        if (!newKidName.trim()) {
            Swal.fire({text: "Kid must have a display name.", icon: "error"});
            return;
        }

        let kidPayload = {
            displayName: newKidName,
            profilePic: newKidPic ? await fileToBase64(newKidPic) : null
        };

        AxiosInstance.post("/api/user/kid", kidPayload, {headers: {'Content-Type': 'application/json'}})
            .then(res => {
                setKids([...kids, res.data]);
                Swal.fire({text: "Kid created!", icon: "success"});
                setNewKidName("");
                setNewKidPic(null);
                setNewKidPicPreview("/shrug.png");

                if (newKidPicInputRef.current) {
                    newKidPicInputRef.current.value = null; // reset the file input
                }
            })
            .catch(err => Swal.fire({
                text: err?.response?.data?.message || "Error creating kid.",
                icon: "error"
            }));
    };

    // ---------------------------
    // UPDATE KID
    // ---------------------------
    const handleUpdateKid = async (kid) => {
        const updatedPayload = {
            id: kid.id,
            displayName: kid.displayName,
            profilePic: kid.profilePic instanceof File ? await fileToBase64(kid.profilePic) : kid.profilePic
        };

        AxiosInstance.put("/api/user/kid", updatedPayload, {headers: {'Content-Type': 'application/json'}})
            .then(res => {
                setKids(kids.map(k => k.id === res.data.id ? res.data : k));
                Swal.fire({text: "Kid updated!", icon: "success"});
            })
            .catch(() => Swal.fire({text: "Error updating kid.", icon: "error"}));
    };

    // ---------------------------
    // DELETE KID
    // ---------------------------
    const handleDeleteKid = (kidId) => {
        Swal.fire({
            text: "Delete this kid?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
        }).then(result => {
            if (!result.isConfirmed) return;

            AxiosInstance.delete(`/api/user/kid/${kidId}`)
                .then(() => {
                    setKids(kids.filter(k => k.id !== kidId));
                    Swal.fire({text: "Kid deleted.", icon: "success"});
                })
                .catch(() => Swal.fire({text: "Error deleting kid.", icon: "error"}));
        });
    };

    // ---------------------------
    // UTILITY
    // ---------------------------
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // just Base64 string
        reader.onerror = error => reject(error);
    });

    // ---------------------------
    // RENDER
    // ---------------------------
    return (
        <>
            <img width="150" height="150" className="img-thumbnail mb-3" src={profilePicBytes}/>

            <Form onSubmit={handleSubmit}>
                <FloatingLabel label="Display Name" className="mb-2">
                    <Form.Control required type="text" maxLength="18"
                                  onChange={(e) => setDisplayName(e.target.value)} value={displayName}/>
                </FloatingLabel>

                <FloatingLabel label="Profile Pic" className="mb-2">
                    <Form.Control type="file" onChange={(e) => {
                        setProfilePic(e.target.files[0]);
                        setProfilePicBytes(URL.createObjectURL(e.target.files[0]));
                    }}/>
                </FloatingLabel>

                <Form.Label htmlFor="teams">Teams</Form.Label>
                <Form.Select multiple required value={teams} onChange={handleChange} className="mb-2">
                    {allTeams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                </Form.Select>

                <FloatingLabel label="Reddit Username" className="mb-3">
                    <Form.Control type="text" maxLength="40"
                                  value={redditUsername} onChange={(e) => setRedditUsername(e.target.value)}/>
                </FloatingLabel>

                <FloatingLabel label="New Password" className="mb-1">
                    <Form.Control type="password" minLength={8} maxLength={50}
                                  onChange={(e) => setPassword(e.target.value)}/>
                </FloatingLabel>

                <FloatingLabel label="Confirm Password" className="mb-2">
                    <Form.Control type="password" onChange={(e) => setPasswordConfirm(e.target.value)}/>
                </FloatingLabel>

                <Button className="w-100 mt-3" variant="primary" type="submit">Update</Button>
            </Form>

            <hr className="my-4"/>
            <h4>Kids</h4>
            <p className="text-muted mb-3" style={{fontSize: '0.9rem'}}>
                Let your kids play, too! Kid picks will only be visible to your friends, not the global leaderboards.
            </p>

            {kids.map(kid => (
                <div key={kid.id} className="d-flex align-items-center mb-2">
                    <label style={{cursor: 'pointer', marginBottom: 0}}>
                        <img
                            src={kid.profilePic instanceof File
                                ? URL.createObjectURL(kid.profilePic)
                                : kid.profilePic
                                    ? "data:image/png;base64," + kid.profilePic
                                    : "/shrug.png"}
                            width={60} height={60} className="rounded me-2"
                        />
                        <input
                            type="file"
                            style={{display: 'none'}}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                setKids(kids.map(k => k.id === kid.id ? {...k, profilePic: file} : k));
                            }}
                        />
                    </label>

                    <input
                        type="text"
                        value={kid.displayName}
                        onChange={(e) => setKids(kids.map(k => k.id === kid.id ? {
                            ...k,
                            displayName: e.target.value
                        } : k))}
                        className="form-control me-2"
                        style={{maxWidth: '200px'}}
                    />

                    <Button variant="success" size="sm" onClick={() => handleUpdateKid(kid)}>Update</Button>
                    <Button variant="danger" size="sm" className="ms-2"
                            onClick={() => handleDeleteKid(kid.id)}>Delete</Button>
                </div>
            ))}

            <hr className="my-3"/>
            <h5 className="d-flex align-items-center">
                Add Kid
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowAddKidForm(!showAddKidForm)}
                    style={{ lineHeight: '1', padding: '0 0.5rem', marginLeft: '0.5rem' }}
                >
                    {showAddKidForm ? "−" : "+"}
                </Button>
            </h5>
            {showAddKidForm && (
                <div className="mb-3">
                    <FloatingLabel label="Kid Display Name" className="mb-2">
                        <Form.Control type="text" value={newKidName} maxLength={40}
                                      onChange={(e) => setNewKidName(e.target.value)}/>
                    </FloatingLabel>

                    <FloatingLabel label="Kid Profile Pic" className="mb-2">
                        <Form.Control type="file" onChange={(e) => {
                            setNewKidPic(e.target.files[0]);
                            setNewKidPicPreview(URL.createObjectURL(e.target.files[0]));
                        }}/>
                    </FloatingLabel>

                    <img src={newKidPicPreview} width={80} height={80} className="img-thumbnail mb-2"/>

                    <Button variant="success" className="w-100" onClick={handleCreateKid}>Create Kid</Button>
                </div>
            )}
        </>
    );
}
