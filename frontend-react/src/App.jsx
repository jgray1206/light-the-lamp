import React from 'react';
import './App.css'
import Routes from "./components/Routes"
import AuthProvider from './provider/authProvider';

export default function App() {
    const storedTheme = localStorage.getItem('theme');
    let theme;
    if (storedTheme) {
        theme = storedTheme;
    } else {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-bs-theme', theme);
    return (
        <div>
            <AuthProvider>
                <Routes/>
            </AuthProvider>
        </div>
    );
}