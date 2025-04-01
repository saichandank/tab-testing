import React, { useEffect, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';

function Hello() {
  const [backendOutput, setBackendOutput] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:5001/')
      .then(response => response.text())
      .then(text => setBackendOutput(text))
      .catch(error => console.error('Error fetching backend:', error));
  }, []);

  return (
    <div>
      <h1>electron-react-boilerplate</h1>
      <h2>Output from Flask Backend:</h2>
      <div>{backendOutput}</div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}