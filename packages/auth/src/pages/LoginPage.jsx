import { useState } from 'react'
import '../styles/global-styles.css'
import '../styles/Login.css'

import logo from '../assets/surrey-food-bank-logo.png'

import { Input, Card, Button, Text, NavLink, Typography, Image } from '@mantine/core';

import {login} from '../../../../frontend/api/auth.js';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      const result = await login(username, password);
      if (result && result.token) {
        sessionStorage.setItem('token', result.token);
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
        <Image src={logo} h={150} w="auto" m={10} p={2}/>
        <Input placeholder='Username' value={username} onChange={e => setUsername(e.target.value)} />
        <Input placeholder='Password' type='password' value={password} onChange={e => setPassword(e.target.value)} />
        <Button onClick={handleLogin}>Login</Button>
        {error && <Text color="red" mt={10}>{error}</Text>}
        <div>
          <NavLink 
          className='link' 
          label="Don't have an account?" 
          />
          <NavLink className='link' label="Forgot Password?" />
        </div>
      </Card>
    </div>
  )
}
