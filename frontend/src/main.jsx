import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'

import './index.css'
import { MantineProvider, createTheme } from '@mantine/core';
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/adminDashboard.jsx';
import ClientDashboard from './pages/clientDashboard.jsx';
import ProtectedRoute from './routes/protectedroute.jsx';
import AdminRoute from './routes/adminroute.jsx';
const theme = createTheme({})

createRoot(document.getElementById('root')).render(
    <MantineProvider theme={theme}>
      <Notifications position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path="/adminDashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/clientDashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
)
