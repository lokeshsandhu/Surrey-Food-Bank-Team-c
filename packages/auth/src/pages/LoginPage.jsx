import { useState } from 'react'
import '../styles/global-styles.css'
import '../styles/Login.css'

import logo from '../assets/surrey-food-bank-logo.png'

import { Input, Card, Button, Text, NavLink, Typography, Image } from '@mantine/core';

export default function LoginPage() {

  return (
    <div className="top-container linear-gradient">
      <Card className="login-card card" padding={20}>
        <Image src={logo} h={150} w="auto" m={10} p={2}/>
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
