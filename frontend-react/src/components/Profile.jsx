import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import { MdAdd, MdPhotoCamera } from "react-icons/md";
import api, { confirm, showError, showSuccess } from "../lib/api";
import { resizeImage } from "../lib/resizeImage";
import TeamChecklist from "./TeamChecklist";

// Pics are stored and sent as base64
const picSrc = (base64) => (base64 ? "data:image/png;base64," + base64 : "/shrug.png");

const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

// A round avatar that opens a file picker when tapped. The chosen photo is shrunk before
// onChange({ file, base64 }) is called, so previews and uploads are always small.
function AvatarPicker({ src, size, onChange, label }) {
    const [busy, setBusy] = useState(false);

    const handleFile = async (e) => {
        const input = e.target;
        const chosen = input.files[0];
        if (!chosen) return;
        setBusy(true);
        try {
            const file = await resizeImage(chosen);
            onChange({ file, base64: await fileToBase64(file) });
        } catch (err) {
            showError(err);
        } finally {
            setBusy(false);
            // Only clear once the photo has been read: on iOS, clearing it early can release the file.
            // Clearing lets picking the same photo again still fire onChange.
            input.value = "";
        }
    };

    return (
        <label className={"avatar-picker" + (busy ? " is-busy" : "")} style={{ width: size, height: size }} aria-label={label}>
            <img src={src} alt="" width={size} height={size} className="avatar" />
            <span className="avatar-picker-badge"><MdPhotoCamera /></span>
            {/* visually hidden rather than display:none, which iOS Safari can be flaky with */}
            <input type="file" accept="image/*" className="visually-hidden" onChange={handleFile} />
        </label>
    );
}

export default function Profile() {
    const { user, teams: rawTeams } = useLoaderData();
    const allTeams = [...rawTeams].sort((a, b) => a.teamName.localeCompare(b.teamName));

    const [displayName, setDisplayName] = useState(user.displayName);
    const [redditUsername, setRedditUsername] = useState(user.redditUsername ?? "");
    const [teams, setTeams] = useState(user.teams?.map((t) => String(t.id)) ?? []);
    const [profilePic, setProfilePic] = useState(null); // { file, base64 } once a new pic is chosen
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password && password !== passwordConfirm) {
            showError({ message: "Passwords must match!" });
            return;
        }
        const formData = new FormData();
        if (profilePic) formData.set("profilePic", profilePic.file);
        formData.set("displayName", displayName);
        formData.set("redditUsername", redditUsername);
        if (password) formData.set("password", password);
        formData.set("teams", teams.map(Number));

        setSaving(true);
        try {
            await api.put("/api/user", formData, { headers: { "content-type": "multipart/form-data" } });
            showSuccess("Profile saved!");
        } catch (err) {
            showError(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Form onSubmit={handleSubmit} className="panel">
                <div className="d-flex align-items-center gap-3 mb-3">
                    <AvatarPicker size={96} label="Change profile picture"
                                  src={picSrc(profilePic?.base64 ?? user.profilePic)}
                                  onChange={setProfilePic} />
                    <div>
                        <h2 className="h5 mb-0">{displayName || "Your profile"}</h2>
                        <div className="small text-body-secondary">Tap the picture to change it</div>
                    </div>
                </div>

                <FloatingLabel label="Display name" className="mb-2">
                    <Form.Control required maxLength={18} placeholder="Display name" value={displayName}
                                  onChange={(e) => setDisplayName(e.target.value)} />
                </FloatingLabel>
                <FloatingLabel label="Reddit username (optional)" className="mb-3">
                    <Form.Control maxLength={40} placeholder="Reddit username" value={redditUsername}
                                  onChange={(e) => setRedditUsername(e.target.value)} />
                </FloatingLabel>

                <Form.Label className="fw-medium">Your teams</Form.Label>
                <TeamChecklist teams={allTeams} selected={teams} onChange={setTeams} />

                <details className="mt-3">
                    <summary className="fw-medium">Change password</summary>
                    <FloatingLabel label="New password" className="mt-2 mb-2">
                        <Form.Control type="password" minLength={8} maxLength={50} placeholder="New password"
                                      autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
                    </FloatingLabel>
                    <FloatingLabel label="Confirm new password">
                        <Form.Control type="password" placeholder="Confirm new password" autoComplete="new-password"
                                      onChange={(e) => setPasswordConfirm(e.target.value)} />
                    </FloatingLabel>
                </details>

                <Button className="w-100 mt-3" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
            </Form>

            <Kids initialKids={user.kids ?? []} />
        </>
    );
}

function Kids({ initialKids }) {
    const [kids, setKids] = useState(initialKids);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPic, setNewPic] = useState(null); // base64

    const editKid = (id, patch) => setKids(kids.map((k) => (k.id === id ? { ...k, ...patch } : k)));

    const createKid = async () => {
        if (!newName.trim()) {
            showError({ message: "Kid must have a display name." });
            return;
        }
        try {
            const { data } = await api.post("/api/user/kid", {
                displayName: newName,
                profilePic: newPic,
            });
            setKids([...kids, data]);
            setNewName("");
            setNewPic(null);
            setShowAdd(false);
            showSuccess("Kid added!");
        } catch (err) {
            showError(err);
        }
    };

    const updateKid = async (kid) => {
        try {
            const { data } = await api.put("/api/user/kid", {
                id: kid.id,
                displayName: kid.displayName,
                profilePic: kid.profilePic,
            });
            editKid(kid.id, data);
            showSuccess("Kid updated!");
        } catch (err) {
            showError(err);
        }
    };

    const deleteKid = async (kid) => {
        if (!(await confirm(`Delete ${kid.displayName}?`, { confirmButtonText: "Delete" }))) return;
        try {
            await api.delete(`/api/user/kid/${kid.id}`);
            setKids(kids.filter((k) => k.id !== kid.id));
        } catch (err) {
            showError(err);
        }
    };

    return (
        <div className="panel">
            <h2 className="h5">Kids</h2>
            <p className="small text-body-secondary">
                Let your kids play, too! Kid picks are only visible to your friends, not the global leaderboards.
            </p>

            {kids.map((kid) => (
                <div key={kid.id} className="d-flex align-items-center gap-2 mb-2">
                    <AvatarPicker size={48} label={`Change ${kid.displayName}'s picture`} src={picSrc(kid.profilePic)}
                                  onChange={({ base64 }) => editKid(kid.id, { profilePic: base64 })} />
                    <Form.Control size="sm" value={kid.displayName} maxLength={40} aria-label="Kid's name"
                                  onChange={(e) => editKid(kid.id, { displayName: e.target.value })} />
                    <Button variant="outline-primary" size="sm" onClick={() => updateKid(kid)}>Save</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => deleteKid(kid)}>Delete</Button>
                </div>
            ))}

            {showAdd ? (
                <div className="border-top pt-3 mt-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <AvatarPicker size={48} label="Choose a picture" src={picSrc(newPic)}
                                      onChange={({ base64 }) => setNewPic(base64)} />
                        <span className="small text-body-secondary">Tap to add a picture (optional)</span>
                    </div>
                    <FloatingLabel label="Kid's display name" className="mb-2">
                        <Form.Control value={newName} maxLength={40} placeholder="Kid's display name"
                                      onChange={(e) => setNewName(e.target.value)} />
                    </FloatingLabel>
                    <div className="d-flex gap-2">
                        <Button variant="primary" className="flex-grow-1" onClick={createKid}>Add kid</Button>
                        <Button variant="outline-secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline-primary" size="sm" className="d-inline-flex align-items-center gap-1"
                        onClick={() => setShowAdd(true)}>
                    <MdAdd /> Add a kid
                </Button>
            )}
        </div>
    );
}
