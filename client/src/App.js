import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Profile from './pages/Profile';
import GlobalAdminDashboard from './pages/GlobalAdminDashboard';

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:roomId" element={<RoomDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<GlobalAdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default App;
