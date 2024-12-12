import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import Admin from './Admin';
import Chat from './Chat';
import './index.css';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/chat" element={<Chat />} />
        </Routes>
    );
}

export default App;