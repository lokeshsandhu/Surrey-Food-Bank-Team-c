import { useState } from 'react'
import '../styles/global-styles.css'
import '../styles/Login.css'

import { Input, Card, Button, Text, NavLink, Typography } from '@mantine/core';

export default function LoginPage() {

  return (
    <div className="top-container linear-gradient">
      <Card className="card" padding={20}>
        <h2 className='login-title'>Login</h2>
        <Input placeholder='Username' />
        <Input placeholder='Password' />
        <Button>Login</Button>
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
