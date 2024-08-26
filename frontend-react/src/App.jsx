import React from 'react';
import './App.css'
import Routes from "./components/Routes"
import AuthProvider from './provider/authProvider';

export default function App() {
  return (
    <div>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </div>
  );
}