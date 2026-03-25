import React, { useState } from 'react';
import '../styles/global-styles.css';
import '../styles/Login.css';

import logo from '../assets/surrey-food-bank-logo.png';

import { Button, Card, Image, PasswordInput, Title, Group } from '@mantine/core';
import { useNavigate } from 'react-router';
import { useForm, matchesField } from '@mantine/form';
import validator from 'validator';
import { notifications } from '@mantine/notifications';

export default function ResetPasswordPage() {
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            user_password: '',
            confirm_password: ''
        },
        validateInputOnBlur: true,
        validateInputOnChange: true,
        validate: {
            user_password: (value) => validator.isStrongPassword(value) ? null : 'Password must contain 8+ characters, uppercase, lowercase, number, and symbol.',
            confirm_password: matchesField('user_password', 'Passwords do not match. Please re-try.'),
        }
    });

    const handleResetPassword = async () => {
        alert('To implement: Reset password');
        // TODO: API Request to reset password

        // ON SUCCESS: send to login page
        notifications.show({
            title: "Password Reset Successfully",
            message: "Please login with your new password.",
            color: "green",
        });
        navigate('/login');

        // TODO: ON FAIL: ?
        // notifications.show({
        //     title: "Error Resetting Password",
        //     message: "Please try agin.",
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
                <Title order={3} fw={500} mb={2} style={{ justifyContent: 'flex-start' }}>Reset Your Password</Title>
                <Group style={{ flexDirection: 'column', gap: 40, justifyContent: 'flex-start' }}>
                    <PasswordInput
                        label="New Password"
                        placeholder="Enter new password"
                        key={form.key('user_password')}
                        {...form.getInputProps('user_password')}
                        h={'60px'}
                        w='100%'
                        withAsterisk
                    />
                    <PasswordInput
                        label="Confirm New Password"
                        placeholder="Re-enter new password"
                        key={form.key('confirm_password')}
                        {...form.getInputProps('confirm_password')}
                        h={'60px'}
                        w='100%'
                        mb={20}
                        withAsterisk
                    />
                </Group>
                <Button onClick={handleResetPassword}>Reset Password</Button>
            </Card>
        </div>
    );
}
