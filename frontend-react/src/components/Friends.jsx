import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useRevalidator, useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { MdContentCopy, MdShare } from "react-icons/md";
import api, { confirm, showError } from "../lib/api";
import useProfilePics from "../lib/useProfilePics";

export default function Friends() {
    const user = useLoaderData();
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const [searchParams] = useSearchParams();
    const addFriend = searchParams.get("addFriend");
    const friends = user.friends ?? [];
    const pics = useProfilePics(friends.map((f) => f.id));

    // Arriving from someone's friend link: add them, then drop the param
    const handledAddFriend = useRef(false);
    useEffect(() => {
        if (!addFriend || handledAddFriend.current) return;
        handledAddFriend.current = true;
        api.post(`/api/friends/${addFriend}`)
            .then(() => navigate("/friends", { replace: true }))
            .catch(showError);
    }, [addFriend, navigate]);

    const removeFriend = async (friend) => {
        if (!(await confirm(`Remove ${friend.displayName} from your friends?`, { confirmButtonText: "Remove", icon: "question" }))) return;
        try {
            await api.delete(`/api/friends/${friend.id}`);
            revalidator.revalidate();
        } catch (err) {
            showError(err);
        }
    };

    return (
        <>
            <div className="panel">
                <h2 className="h5">Invite friends</h2>
                <FriendLink uuid={user.confirmationUuid} />
            </div>

            <div className="panel">
                <h2 className="h5">Your friends</h2>
                {friends.length === 0 ? (
                    <p className="text-body-secondary mb-0">No friends yet! Send them your link above.</p>
                ) : (
                    <ul className="list-unstyled mb-0 friend-list">
                        {friends.map((friend) => (
                            <li key={friend.id}>
                                <img src={pics.get(friend.id) ?? "/shrug.png"} alt="" width="48" height="48" className="avatar" />
                                <span className="flex-grow-1 fw-medium">{friend.displayName}</span>
                                <Button variant="outline-danger" size="sm" onClick={() => removeFriend(friend)}>Remove</Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

function FriendLink({ uuid }) {
    const link = `https://www.lightthelamp.dev/friends?addFriend=${uuid}`;
    const message = "Add me on Light the Lamp!";
    const [copied, setCopied] = useState(false);
    const canShare = typeof navigator.share === "function";

    const share = async () => {
        if (canShare) {
            try {
                await navigator.share({ title: "Light the Lamp", text: message, url: link });
            } catch {
                // user closed the share sheet
            }
            return;
        }
        await navigator.clipboard.writeText(`${message} ${link}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <>
            <InputGroup>
                <Form.Control readOnly value={link} aria-label="Your friend link" onFocus={(e) => e.target.select()} />
                <Button variant="primary" onClick={share} className="d-inline-flex align-items-center gap-1">
                    {canShare ? <><MdShare /> Share</> : <><MdContentCopy /> {copied ? "Copied!" : "Copy"}</>}
                </Button>
            </InputGroup>
            <Form.Text>Send this link to friends. When they open it, they'll add you as a friend.</Form.Text>
        </>
    );
}
