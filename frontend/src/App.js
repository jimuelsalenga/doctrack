import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';           // Requester Dashboard
import AdminDashboard from './pages/AdminDashboard'; // Admin Dashboard
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Default Route - Redirects the blank root url (/) directly to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login & Register */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User (Requester) Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Catch-all route - If a user types a weird URL, send them back to Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;