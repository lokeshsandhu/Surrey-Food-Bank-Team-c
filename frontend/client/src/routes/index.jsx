import { Routes, Route } from 'react-router';
import LoginPage from '../../../../packages/auth/src/pages/LoginPage.jsx';
import RegisterPage from '../../../../packages/auth/src/pages/RegisterPage.jsx';
import ClientDashboard from '../pages/clientDashboard.jsx';

export default function ClientRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<ClientDashboard />} />
        </Routes>
    )
}