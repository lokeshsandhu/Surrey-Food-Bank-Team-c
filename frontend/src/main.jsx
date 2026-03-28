import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { notifications, Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/schedule/styles.css';

import './index.css';
import { MantineProvider, createTheme } from '@mantine/core';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/adminDashboard.jsx';
import ClientDashboard from './pages/clientDashboard.jsx';
import TimeslotPage from './pages/timeslotPage.jsx';
import ProtectedRoute from './routes/protectedroute.jsx';
import AdminRoute from './routes/adminroute.jsx';
import ClientList from './pages/clientList.jsx';
import { ClientAccountAdminView, ClientAccountClientView } from './pages/clientAccount.jsx';
import RequestPasswordChangePage from './pages/RequestPasswordChangePage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  primaryColor: 'red',
  white: '#F2F2F2'
});

const notifStyle = {
  root: {
    width: 600,
    padding: '20px',
    minHeight: 500,
  },
  title: {
    fontSize: 18,
  },
  description: {
    fontSize: 16,
  },
  notification: {
    pointerEvents: 'auto',
  }
};

createRoot(document.getElementById('root')).render(
  <MantineProvider theme={theme}>
    <Notifications position="top-center" styles={notifStyle} />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/requestPasswordChange" element={<RequestPasswordChangePage />} />
        <Route path="/resetPassword" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/adminDashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/adminDashboard/timeslots" element={<AdminRoute><TimeslotPage /></AdminRoute>} />
        <Route path="/adminDashboard/clientList" element={<AdminRoute><ClientList /></AdminRoute>} />
        <Route path="/adminDashboard/clientList/account/:username" element={<AdminRoute><ClientAccountAdminView /></AdminRoute>} />
        <Route path="/clientDashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/clientDashboard/account/:username" element={<ProtectedRoute><ClientAccountClientView /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </MantineProvider>
);
