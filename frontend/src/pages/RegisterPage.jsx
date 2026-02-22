import React, { useEffect, useRef } from 'react';
import { act, useState } from 'react'
import '../styles/global-styles.css'
import '../styles/Register.css'

import logo from '../assets/surrey-food-bank-logo.png'

import EligibilityQuestions from '../components/EligibilityQuestions.jsx'
import AccountInformation from '../components/AccountInformation.jsx'
import AddFamilyMembers from '../components/AddFamilyMembers.jsx'
import RegistrationFinished from '../components/RegistrationFinished.jsx'

import { Input, Card, Button, Text, NavLink, Typography, Timeline, Image, Stepper, Group } from '@mantine/core';
import { useForm, isNotEmpty, hasLength, matchesField, isEmail } from '@mantine/form'

import { useNavigate } from 'react-router';

import validator from 'validator'
import {createAccount} from '../../api/accounts.js';
import {login, me} from '../../api/auth.js';
import {createFamilyMember} from '../../api/familyMembers.js';
export default function RegisterPage() {
    const errorRef = useRef(null);
    const [activeSection, setActiveSection] = useState(0)
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
    const [registerError, setRegisterError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        if (registerError && activeSection === 2 && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [registerError, activeSection]);

    const prevSection = () => {
        if (activeSection === 0) {
            navigate('/');
        }
        setActiveSection((current) => (current > 0 ? current - 1 : current));
        setRegisterError('');
    };

    const form = useForm({
        initialValues: {
            username: '',
            user_password: '',
            confirm_password: '',
            canada_status: '',
            household_size: 0,
            baby_or_pregnant: '',
            addr: {
                line1: '',
                line2: '',
                city: '',
                province: '',
                postal_code: ''
            },
            main_family_member:
            {
                f_name: '',
                l_name: '',
                dob: null,
                phone: '',
                email: '',
                relationship: 'Main'
            },
            family_members: []
        },
        validateInputOnBlur: true,
        validateInputOnChange: true,
        validate: {
            username: hasLength({ min: 5 }, 'Username must be at least 5 characters'),
            user_password: (value) => validator.isStrongPassword(value) ? null : 'Password must contain 8+ characters, uppercase, lowercase, number, and symbol.',
            confirm_password: matchesField('user_password', 'Passwords do not match. Please re-try.'),
            canada_status: (value) => value ? value === 'ineligible' ? 'You are not eligible to register for Surrey Food Bank.' : null : 'Please select an option.',
            baby_or_pregnant: (value) => value && value.length > 0 ? null : 'Please select an option.',
            addr: {
                line1: isNotEmpty('Please enter your address.'),
                city: isNotEmpty('Please enter your city.'),
                province: isNotEmpty('Please enter your province.'),
                postal_code: (value) => value ? (validator.isPostalCode(value, 'CA') ? null : 'Please enter a valid postal code') : 'Please enter your postal code.'
            },
            main_family_member: {
                f_name: (value) => value && value.length > 0 ? null : 'Please enter your first name.',
                l_name: (value) => value && value.length > 0 ? null : 'Please enter your last name.',
                dob: (value) => value && value.length > 0 ? null : 'Please enter your date of birth.',
                email: (value) => value && value.length > 0 && validator.isEmail(value) ? null : 'Please enter a valid email.',
                phone: (value) => value.length > 0 ? null : 'Please enter a valid phone number.'
            },
            family_members: {
                f_name: (value) => value && value.length > 0 ? null : 'Please enter your first name.',
                l_name: (value) => value && value.length > 0 ? null : 'Please enter your last name.',
                dob: (value) => value && value.length > 0 ? null : 'Please enter your date of birth.',
                email: (value) => value && value.length > 0 && validator.isEmail(value) ? null : 'Please enter a valid email.',
                relationship: (value) => value.length > 0 ? null : 'Please enter your relationship to this family member.'
            }
        }
    })

    const nextSection = async () => {
        let fieldsToValidate = [];

        if (activeSection === 0) {
            fieldsToValidate = [
                "canada_status",
                "addr.line1",
                "addr.city",
                "addr.province",
                "addr.postal_code",
            ];
        }

        if (activeSection === 1) {
            fieldsToValidate = [
                "username",
                "user_password",
                "confirm_password",
                "baby_or_pregnant",
                "main_family_member.f_name",
                "main_family_member.l_name",
                "main_family_member.dob",
                "main_family_member.email",
                "main_family_member.phone",
            ];
        }

        if (activeSection === 2) {
            fieldsToValidate = form.values.family_members.flatMap((_, index) => [
                `family_members.${index}.f_name`,
                `family_members.${index}.l_name`,
                `family_members.${index}.dob`,
                `family_members.${index}.email`,
                `family_members.${index}.relationship`,
            ]);
        }

        let hasErrors = false;

        fieldsToValidate.forEach((field) => {
            const result = form.validateField(field);
            if (result.hasError) {
                hasErrors = true;
            }
        });

        if (!hasErrors) {
            if (activeSection === 2) {
                setRegisterError('');
                // Check for duplicate first names (including main account holder)
                const allFirstNames = [form.values.main_family_member.f_name, ...form.values.family_members.map(m => m.f_name)];
                const nameSet = new Set();
                let duplicateFound = false;
                for (const name of allFirstNames) {
                    if (nameSet.has(name)) {
                        duplicateFound = true;
                        break;
                    }
                    nameSet.add(name);
                }
                if (duplicateFound) {
                    setRegisterError('You cannot add two family members with the same first name. Please use a unique first name for each family member.');
                    return;
                }
                const householdSize = 1 + form.values.family_members.length;
                const accountData = {
                    username: form.values.username,
                    user_password: form.values.user_password,
                    canada_status: form.values.canada_status,
                    household_size: householdSize,
                    addr: form.values.addr.line1 + ', ' + form.values.addr.line2 + ', ' + form.values.addr.city + ', ' + form.values.addr.province + ', ' + form.values.addr.postal_code,
                    baby_or_pregnant: form.values.baby_or_pregnant === 'true',
                };
                try {
                    const result = await createAccount(accountData);
                    if (result && result.username) {
                        // Login immediately after account creation
                        const loginResult = await login(accountData.username, accountData.user_password);
                        if (loginResult && loginResult.token) {
                            sessionStorage.setItem('token', loginResult.token);
                            // Add main account holder as a family member with relationship 'owner'
                            const ownerData = {
                                username: accountData.username,
                                f_name: form.values.main_family_member.f_name,
                                l_name: form.values.main_family_member.l_name,
                                dob: form.values.main_family_member.dob,
                                phone: form.values.main_family_member.phone,
                                email: form.values.main_family_member.email,
                                relationship: 'owner',
                            };
                            try {
                                await createFamilyMember(loginResult.token, ownerData);
                                // Add each additional family member
                                for (const member of form.values.family_members) {
                                    const memberData = {
                                        username: accountData.username,
                                        f_name: member.f_name,
                                        l_name: member.l_name,
                                        dob: member.dob,
                                        phone: member.phone,
                                        email: member.email,
                                        relationship: member.relationship,
                                    };
                                    await createFamilyMember(loginResult.token, memberData);
                                }
                                setActiveSection((current) => (current < 3 ? current + 1 : current));
                            } catch (famErr) {
                                setRegisterError('There was a problem adding your family members. Please try again.');
                                return;
                            }
                        } else {
                            setRegisterError('Sorry, we could not log you in automatically. Please try logging in manually.');
                        }
                    } else {
                        setRegisterError(result?.error || result?.message || 'Registration failed');
                    }
                } catch (err) {
                    setRegisterError('Registration failed');
                }
            } else {
                setActiveSection((current) => (current < 3 ? current + 1 : current));
            }
        }
    }

    return (
        <div className="top-container linear-gradient">
            <Card className="register-card card" padding={20} >
                <Group>
                    <Image src={logo} h={80} w="auto" m={10} p={2} />
                    <h2 className='login-title'>Registration Form</h2>
                </Group>
                <Stepper active={activeSection} onStepClick={setActiveSection} allowNextStepsSelect={false}>
                    <Stepper.Step label="Eligibility Questions">
                        <EligibilityQuestions form={form} />
                    </Stepper.Step>
                    <Stepper.Step label="Account and Personal Information">
                        <AccountInformation form={form} />
                    </Stepper.Step>
                    <Stepper.Step label="Add Family Members">
                        <AddFamilyMembers form={form} />
                    </Stepper.Step>
                    <Stepper.Completed>
                        <RegistrationFinished />
                    </Stepper.Completed>
                </Stepper>
                <Group justify="space-between" align='end' mt="md">
                    <Button variant="default" onClick={prevSection}>Back</Button>
                    <Button
                        onClick={activeSection === 3 ? async () => {
                            const username = form.values.username;
                            const password = form.values.user_password;
                            try {
                                const result = await login(username, password);
                                if (result && result.token) {
                                    sessionStorage.setItem('token', result.token);
                                    // Fetch user info to determine role
                                    const userInfo = await me(result.token);
                                    if (userInfo && userInfo.role === 'admin') {
                                        window.location.href = '/adminDashboard';
                                    } else if (userInfo && userInfo.role === 'client') {
                                        window.location.href = '/clientDashboard';
                                    } else {
                                        window.location.href = '/dashboard'; // fallback
                                    }
                                } else {
                                    setRegisterError('Sorry, we could not log you in automatically. Please try logging in manually.');
                                }
                            } catch (err) {
                                setRegisterError('Sorry, we could not log you in automatically. Please try logging in manually.');
                            }
                        } : nextSection}
                        color={activeSection >= 2 ? 'rgba(3, 161, 11, 1)' : 'blue'}
                    >
                        {activeSection === 2 ? 'Register' : activeSection === 3 ? 'Continue to Dashboard' : 'Next'}
                    </Button>
                </Group>
                {activeSection === 2 && registerError && (
                    <div ref={errorRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                        <Text color="red" size="lg" style={{ textAlign: 'center', maxWidth: 400 }}>
                            {registerError === 'Registration failed' || registerError === 'Registration failed.' || registerError === 'Internal server error' ?
                                'Sorry, we could not create your account. Please check your information and try again.' :
                                registerError.includes('duplicate') || registerError.includes('already exists') ?
                                    'That username is already taken. Please choose a different one.' :
                                    'Sorry, ' + registerError.replace(/_/g, ' ').replace(/username/i, 'account name')}
                        </Text>
                    </div>
                )}
            </Card>
        </div>
    )
}