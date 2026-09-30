import { useState } from "react";
import Button from "react-bootstrap/Button";
import { getToken } from "firebase/messaging";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoShareOutline } from "react-icons/io5";
import api, { showError } from "../lib/api";
import messaging from "../lib/firebase";

const VAPID_KEY = "BL8ysWJGmT7Bq4mQUOnxdpSyChp2dDpyKJLK1y1hKcGFIlXtGpdGLQ7FLnNwdy_263Gr4_K104tlJ3qMGp67oEY";
const ENABLED_KEY = "notifications-enabled";

async function requestPermission() {
    if (!window.Notification) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") {
        throw new Error("Notifications are blocked. Allow them for this app in your phone or browser settings.");
    }
    return (await Notification.requestPermission()) === "granted";
}

export default function Notifications() {
    const [enabled, setEnabled] = useState(localStorage.getItem(ENABLED_KEY) === "true");
    const [busy, setBusy] = useState(false);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const supported = "serviceWorker" in navigator && "PushManager" in window;

    const save = (value) => {
        localStorage.setItem(ENABLED_KEY, String(value));
        setEnabled(value);
    };

    const toggle = async () => {
        setBusy(true);
        try {
            if (enabled) {
                await api.delete("/api/user/notification");
                save(false);
                return;
            }
            if (!(await requestPermission())) {
                throw new Error("You denied or dismissed the notification permission.");
            }
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (!token) throw new Error("Something went wrong enabling notifications, please try again.");
            await api.post(`/api/user/notification/${token}`);
            save(true);
        } catch (err) {
            console.log(err);
            showError(err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="panel">
            <h1 className="h4">Pick reminders</h1>
            <p>
                Get a notification if you haven't picked an hour before one of your games starts.
            </p>
            <p className="small text-body-secondary">
                This is an experimental feature. Since Light the Lamp is a website and not an app-store app, I can't promise how
                reliable notifications will be. If they stop working, try turning them off and on again.
            </p>

            {!isStandalone ? (
                <>
                    <h2 className="h6 mt-4">To turn on notifications:</h2>
                    <ol>
                        <li>If you already added this app to your home screen, remove it and open this page in your phone's browser.</li>
                        <li>
                            Tap Share (iPhone <IoShareOutline className="align-text-bottom" />) or the menu (Android{" "}
                            <BsThreeDotsVertical className="align-text-bottom" />) and choose <strong>Add to Home Screen</strong>.
                        </li>
                        <li>Open the app from your home screen and come back to this page.</li>
                    </ol>
                </>
            ) : !supported ? (
                <p>Notifications aren't supported on this device :( Try updating your phone's operating system.</p>
            ) : (
                <>
                    {enabled && <p className="fw-medium text-success">Notifications are on!</p>}
                    <Button size="lg" className="w-100" variant={enabled ? "outline-secondary" : "primary"}
                            disabled={busy} onClick={toggle}>
                        {enabled ? "Turn off notifications" : "Turn on notifications"}
                    </Button>
                </>
            )}
        </div>
    );
}
