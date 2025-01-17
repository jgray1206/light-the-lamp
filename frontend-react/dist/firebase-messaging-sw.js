importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyAe1UvDpb_BxT0vm29qjL6dsknfXxAOKCA",
    authDomain: "light-the-lamp-3bb33.firebaseapp.com",
    projectId: "light-the-lamp-3bb33",
    storageBucket: "light-the-lamp-3bb33.firebasestorage.app",
    messagingSenderId: "248585092155",
    appId: "1:248585092155:web:4b4abef854e23a22aff01e"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();