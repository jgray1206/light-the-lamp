import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAe1UvDpb_BxT0vm29qjL6dsknfXxAOKCA",
    authDomain: "light-the-lamp-3bb33.firebaseapp.com",
    projectId: "light-the-lamp-3bb33",
    storageBucket: "light-the-lamp-3bb33.firebasestorage.app",
    messagingSenderId: "248585092155",
    appId: "1:248585092155:web:4b4abef854e23a22aff01e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const Messaging = getMessaging(app);
export default Messaging;
