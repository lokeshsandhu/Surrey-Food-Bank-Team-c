import React, { useState } from 'react';
import '../styles/global-styles.css';
import '../styles/Login.css';

import logo from '../assets/surrey-food-bank-logo.png';

import { Button, Card, Image, TextInput, NavLink, Group, Text, Title } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { login, me } from '../../api/auth.js';

export default function RequestPasswordChangePage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleResetEmail = async () => {
        setError('');
        alert('To implement: check if user exists. if so, send email');
        // TODO: Check if user's email is in our database

        // TODO: Send email if the user exists
        // On successful email sent:   
        notifications.show({
                title: "Reset Link Sent",
                message: "Please check your email for the reset link.",
                color: "green",
              });

        //TODO:  If email fails to send:
        // notifications.show({
        //     title: "Error Sending Reset Link",
        //     message: "Please try again in a few minutes.",
        //     color: "red",
        // });
    };

    return (
        <div className="top-container linear-gradient">
            <Card className="login-card card" padding={20} miw={350} maw={400}>
                <Image
                    src={logo}
                    h={70}
                    w="auto"
                    fit="contain"
                    p={2}
                />
                <Group style={{ gap: 2 }} mb={10}>
                    <Title order={3} fw={500} mb={2} style={{ justifyContent: 'center' }}>Forgot Your Password?</Title>
                    <Text size='sm' color='gray'>Enter the email associated with your account and we will send you password reset instructions.</Text>
                </Group>
                <TextInput placeholder='Email' value={email} onChange={e => setEmail(e.target.value)} />
                {error && <Text c="red" mt={10}>{error}</Text>}
                <Button onClick={handleResetEmail}>Send Reset Link</Button>
                <Button variant='light' onClick={() => navigate('/login')}>Back</Button>
            </Card>
        </div>
    );
}
