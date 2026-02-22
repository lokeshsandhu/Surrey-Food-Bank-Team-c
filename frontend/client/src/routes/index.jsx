import { Routes, Route } from 'react-router';
import { LoginPage, RegisterPage } from '../../../../packages/auth/src/index.js';
import ClientDashboard from '../pages/clientDashboard.jsx';
import ProtectedRoute from './protectedroute.jsx';

export default function ClientRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <ClientDashboard />
                </ProtectedRoute>
            } />
        </Routes>
    )
}