import React, { useState } from 'react';
import '../styles/global-styles.css';
import '../styles/Login.css';

import logo from '../assets/surrey-food-bank-logo.png';

import { Button, Card, Group, Image, TextInput, NavLink, PasswordInput, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocation, useNavigate } from 'react-router';

import { login, me } from '../../api/auth.js';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
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
      const result = await login(identifier, password);
      if (result && result.token) {
        sessionStorage.setItem('token', result.token);
        // Fetch user info to determine role
        const userInfo = await me(result.token);
        const resolvedUsername = userInfo?.username || result.username || identifier;
        const resolvedRole = userInfo?.role || result.role;
        sessionStorage.setItem('username', resolvedUsername);
        sessionStorage.setItem('role', resolvedRole);

        if (resolvedRole === 'admin') {
          navigate('/adminDashboard');
        } else if (resolvedRole === 'client') {
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
        <TextInput className='login username' placeholder='Username or Email' value={identifier} onChange={e => setIdentifier(e.target.value)} />
        <PasswordInput
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          className='login password'
        />
        <Button onClick={handleLogin}>Login</Button>
        {error && <Text c="red" mt={10}>{error}</Text>}
        <Group style={{ flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
          <Button
            className='link'
            variant='white'
            size='sm'
            onClick={() => navigate('/register')}
          >
            Create Account
          </Button>
          <Button
            className='link'    
            variant='white'
            size='sm'
            onClick={() => navigate('/requestPasswordChange')}
          >
            Forgot Password?
          </Button>
        </Group>
      </Card>
    </div>
  );
}
