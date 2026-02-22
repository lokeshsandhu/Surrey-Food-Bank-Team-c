import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createTheme, MantineProvider } from '@mantine/core'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'

import './index.css'

import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/adminDashboard.jsx';
import ClientDashboard from './pages/clientDashboard.jsx';
const theme = createTheme({})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path="/adminDashboard" element={<AdminDashboard />} />
          <Route path="/clientDashboard" element={<ClientDashboard />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
)
