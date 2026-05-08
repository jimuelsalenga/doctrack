import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';           // Requester Dashboard
import AdminDashboard from './pages/AdminDashboard'; // Admin Dashboard

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Default Route - Login Page */}
          <Route path="/login" element={<Login />} />

          {/* Login & Register */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User (Requester) Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Optional: Catch-all route for 404 */}
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;