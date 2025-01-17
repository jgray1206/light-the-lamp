import Button from "react-bootstrap/Button";
import {getToken} from "firebase/messaging";
import Messaging from "../provider/firebaseProvider"
import AxiosInstance from '../provider/axiosProvider';
import {useState} from "react";

export default function Notifications(props) {
    const [areEnabled, setAreEnabled] = useState(localStorage.getItem('notifications-enabled') === "true")
    return <>
        {areEnabled && <p>Notifications enabled!</p>}
        {window.matchMedia('(display-mode: standalone)').matches &&
            (("serviceWorker" in navigator && "PushManager" in window) &&
                <Button size="lg" color={areEnabled && "secondary" || "primary"} id="enable-notify" onClick={()=>displayOrDeleteNotification(setAreEnabled, areEnabled)}>{areEnabled && "Disable Notifications" || "Enable Notifications"}</Button>
                || <p>Notifications not supported:(</p>) ||
            <p>First: open this app in Safari/Chrome and tap the Share button, then select 'Add to Home Screen'. Open this app from your home screen and come back to this page.</p>}
    </>;
}

function displayOrDeleteNotification(setAreEnabled, areEnabled) {
    if (areEnabled) {
        deleteNotificationToken(setAreEnabled);
        return
    }
    if (window.Notification && Notification.permission === "granted") {
        notification(setAreEnabled);
    }
        // If the user hasn't told if he wants to be notified or not
        // Note: because of Chrome, we are not sure the permission property
    // is set, therefore it's unsafe to check for the "default" value.
    else if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission(status => {
            if (status === "granted") {
                notification(setAreEnabled);
            } else {
                alert("You denied or dismissed permissions to notifications.");
            }
        });
    } else {
        // If the user refuses to get notified
        alert(
            "You denied permissions to notifications. Please go to your browser or phone setting to allow notifications."
        );
    }
}

function notification(setAreEnabled) {
    getToken(Messaging, {vapidKey: 'BL8ysWJGmT7Bq4mQUOnxdpSyChp2dDpyKJLK1y1hKcGFIlXtGpdGLQ7FLnNwdy_263Gr4_K104tlJ3qMGp67oEY'}).then((currentToken) => {
        if (currentToken) {
            saveNotificationToken(currentToken, setAreEnabled);
        } else {
            alert(
                "Something went wrong enabling notifications, please try again."
            );
        }
    }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
        alert(
            "Something went wrong enabling notifications, please try again. " + err.toString()
        );
    });
}

function saveNotificationToken(token, setAreEnabled) {
    AxiosInstance.post("/api/user/notification/" + token)
        .then(response => {
            localStorage.setItem('notifications-enabled', "true")
            setAreEnabled(true)
        });
}

function deleteNotificationToken(setAreEnabled) {
    AxiosInstance.delete("/api/user/notification")
        .then(response => {
            localStorage.setItem('notifications-enabled', "false")
            setAreEnabled(false)
        });
}