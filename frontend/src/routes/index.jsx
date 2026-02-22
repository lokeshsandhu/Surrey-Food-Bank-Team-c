import { Routes, Route } from 'react-router';
import { LoginPage, RegisterPage } from '../../../../packages/auth/src/index.js';
import AdminDashboard from '../pages/adminDashboard.jsx';
import AdminRoute from './adminroute.jsx';

export default function AdminRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={
                <AdminRoute>
                    <AdminDashboard />
                </AdminRoute>
            } />
        </Routes>
    )
}