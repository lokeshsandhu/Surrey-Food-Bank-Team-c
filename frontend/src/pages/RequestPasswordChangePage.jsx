import React, { useState } from 'react';
import '../styles/global-styles.css';
import '../styles/Login.css';

import logo from '../assets/surrey-food-bank-logo.png';

import { Button, Card, Image, TextInput, Group, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { requestPasswordReset } from '../../api/auth.js';

export default function RequestPasswordChangePage() {
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    const handleResetEmail = async () => {
        setError('');
        if (!identifier.trim()) {
            setError('Please enter your username.');
            return;
        }

        setSubmitting(true);

        try {
            const result = await requestPasswordReset(identifier.trim());
            if (!result?.success) {
                notifications.show({
                    title: "Unable to Send Reset Link",
                    message: result?.error || "Please try again in a moment.",
                    color: "red",
                });
                return;
            }
            notifications.show({
                title: "Reset Link Sent",
                message: "Please check your email for the reset link.",
                color: "green",
            });
        } catch {
            notifications.show({
                title: "Request Received",
                message: "If an account exists, a reset link will be sent.",
                color: "blue",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="top-container linear-gradient">
            <Card component="form" className="login-card card" padding={20} miw={350} maw={400}
                onSubmit={(e) => {
                    e.preventDefault();
                    handleResetEmail();
                }}
            >
                <Image
                    src={logo}
                    h={70}
                    w="auto"
                    fit="contain"
                    p={2}
                />
                <Group style={{ gap: 2 }} mb={10}>
                    <Title order={3} fw={500} mb={2} style={{ justifyContent: 'center' }}>Forgot Your Password?</Title>
                    <Text size='sm' color='gray'>Enter your username or email and we will send password reset instructions to the owner email on file.</Text>
                </Group>
                <TextInput
                    placeholder='Username or Email'
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className='account-recovery'
                />
                {error && <Text c="red" mt={10}>{error}</Text>}
                <Button
                    onClick={handleResetEmail}
                    loading={submitting}
                >Send Reset Link</Button>
                <Button variant='light' onClick={() => navigate('/login')}>Back</Button>
            </Card>
        </div>
    );
}
