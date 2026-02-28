import React, { useState } from 'react'
import '../styles/global-styles.css'
import '../styles/Login.css'

import logo from '../assets/surrey-food-bank-logo.png'

import { Input, Card, Button, Text, NavLink, Typography, Image, PasswordInput } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router';
import { notifications } from '@mantine/notifications';

import { login, me } from '../../api/auth.js';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shownAdminDenied, setShownAdminDenied] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (location.state?.adminDenied && !shownAdminDenied) {
      notifications.show({
        title: "Access Denied",
        message: "You must be an admin to access this page.",
        color: "red",
      });
      setShownAdminDenied(true);
      // Clear the adminDenied flag from location.state
      navigate(window.location.pathname, { replace: true, state: {} });
    }
    // Show notification if redirected from protected route
    if (window && window.sessionStorage && window.sessionStorage.getItem('notifyLoginRedirect')) {
      notifications.show({
        title: "Login Required",
        message: "Please log in to access your dashboard.",
        color: "blue",
      });
      window.sessionStorage.removeItem('notifyLoginRedirect');
    }
  }, [location.state, shownAdminDenied, navigate]);

  const handleLogin = async () => {
    setError('');
    try {
      const result = await login(username, password);
      if (result && result.token) {
        sessionStorage.setItem('token', result.token);
        sessionStorage.setItem('username', username);
        // Fetch user info to determine role
        const userInfo = await me(result.token);
        if (userInfo && userInfo.role === 'admin') {
          navigate('/adminDashboard');
        } else if (userInfo && userInfo.role === 'client') {
          navigate('/clientDashboard');
        } else {
          navigate('/dashboard'); // fallback
        }
      } else {
        setError(result?.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="top-container linear-gradient">
      <Card className="login-card card" padding={20}>
        <Image src={logo} h={150} w="auto" m={10} p={2} />
        <Input placeholder='Username' value={username} onChange={e => setUsername(e.target.value)} />
        <PasswordInput
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button onClick={handleLogin}>Login</Button>
        {error && <Text color="red" mt={10}>{error}</Text>}
        <div>
          <NavLink
            className='link'
            label="Don't have an account?"
            onClick={() => navigate('/register')}
          />
          <NavLink className='link' label="Forgot Password?" />
        </div>
      </Card>
    </div>
  )
}
