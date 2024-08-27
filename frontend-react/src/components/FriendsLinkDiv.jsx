import { useState, useRef } from "react";
import Button from 'react-bootstrap/Button';
import Swal from 'sweetalert2'
import Overlay from 'react-bootstrap/Overlay';
import Tooltip from 'react-bootstrap/Tooltip';

export default function FriendsLinkDiv(props) {
    const addFriendsLink = "https://www.lightthelamp.dev/friends?addFriend=" + props.confirmationUuid;

    const [showToolTip, setShowToolTip] = useState(false);
    const target = useRef(null);

    const copyFriendsLink = () => {
        navigator.clipboard.writeText("Add me on Light the Lamp! " + addFriendsLink);
        setShowToolTip(true);
        setTimeout(() => setShowToolTip(false), 1500);
    }

    return <>
        <div className="input-group">
            <input type="text" id="friend-link" aria-describedby="friends-help" readOnly value={addFriendsLink} />
            <Button size="sm" variant="success" ref={target} onClick={copyFriendsLink}>Copy</Button>
            <Overlay target={target.current} show={showToolTip} placement="top">
                {(props) => (
                    <Tooltip id="overlay-example" {...props}>
                        Copied!
                    </Tooltip>
                )}
            </Overlay>
        </div>
        <div id="friends-help" className="form-text">Send this link to your friends and have them click it to add you.</div>
    </>
}