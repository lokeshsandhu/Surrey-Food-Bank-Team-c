import React, { useEffect, useRef, useState } from 'react';
import '../styles/global-styles.css';
import '../styles/Register.css';

import logo from '../assets/surrey-food-bank-logo.png';

import AccountInformation from '../components/AccountInformation.jsx';
import AddFamilyMembers from '../components/AddFamilyMembers.jsx';
import EligibilityQuestions from '../components/EligibilityQuestions.jsx';
import RegistrationFinished from '../components/RegistrationFinished.jsx';

import { Button, Card, Group, Image, Modal, Stepper, Text, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { isNotEmpty, matchesField, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';

import { useNavigate } from 'react-router';

import validator from 'validator';
import { createAccount, usernameExists } from '../../api/accounts.js';
import { login, me } from '../../api/auth.js';
import { createFamilyMember } from '../../api/familyMembers.js';

import { canadaStatusOptions } from '../constants/FormOptions.js';
import CanadaStatusAlert from '../components/alerts/CanadaStatusAlert.jsx';

export default function RegisterPage() {
    const errorRef = useRef(null);
    const [activeSection, setActiveSection] = useState(0);
    const [registerError, setRegisterError] = useState('');
    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            username: 'allison4',
            user_password: 'Abc1234$',
            confirm_password: 'Abc1234$',
            canada_status: canadaStatusOptions.citizen.value,
            household_size: 0,
            baby_or_pregnant: 'true',
            language_spoken: 'English and Korean',
            account_notes: '',
            addr: {
                line1: '6177 Walter Gage Road',
                line2: '',
                city: 'Surrey',
                province: 'BC',
                postal_code: 'V6T 1Z1'
            },
            main_family_member:
            {
                f_name: 'Allison',
                l_name: 'K',
                dob: '2003-02-18',
                phone: '(123) 456-7890',
                email: 'a@gmail.com',
                relationship: 'owner'
            },
            family_members: []
        },
        // initialValues: {
        //     username: '',
        //     user_password: '',
        //     confirm_password: '',
        //     canada_status: '',
        //     household_size: 0,
        //     baby_or_pregnant: '',
        //     language_spoken: '',
        //     account_notes: '',
        //     addr: {
        //         line1: '',
        //         line2: '',
        //         city: '',
        //         province: '',
        //         postal_code: ''
        //     },
        //     main_family_member:
        //     {
        //         f_name: '',
        //         l_name: '',
        //         dob: null,
        //         phone: '',
        //         email: '',
        //         relationship: 'owner'
        //     },
        //     family_members: []
        // },
        validateInputOnBlur: true,
        validateInputOnChange: true,
        validate: {
            username: (value) => value.trim().length < 5 ? 'Username must be at least 5 characters' : null,
            user_password: (value) => validator.isStrongPassword(value) ? null : 'Password must contain 8+ characters, uppercase, lowercase, number, and symbol.',
            confirm_password: matchesField('user_password', 'Passwords do not match. Please re-try.'),
            canada_status: (value) => {
                if (value.trim().length === 0) {
                    return 'Please select an option.';
                }

                if (value === canadaStatusOptions.visitorIntlStudentLessThan6.value
                    || value === canadaStatusOptions.other.value) {
                    return " ";
                }
            },
            baby_or_pregnant: (value) => value && value.length > 0 ? null : 'Please select an option.',
            language_spoken: isNotEmpty('Please enter your primary language.'),
            addr: {
                line1: isNotEmpty('Please enter your address.'),
                city: (value) => {
                    const val = value.trim().toLowerCase();
                    if (val.length === 0) {
                        return 'Please enter your city.';
                    } else if (
                        val !== 'surrey' &&
                        val !== 'north delta' &&
                        val !== 'cloverdale') {
                        return ' ';
                    }
                },
                province: (value) => {
                    const val = value.trim();
                    if (val.length === 0) {
                        return 'Please enter your province.';
                    } else if (val !== 'BC') {
                        return ' ';
                    }
                },
                postal_code: (value) => value ? (validator.isPostalCode(value, 'CA') ? null : 'Please enter a valid Canadian postal code (e.g. V1M 3B5).') : 'Please enter your postal code.'
            },
            main_family_member: {
                f_name: (value) => value && value.trim().length > 0 ? null : 'Please enter your first name.',
                l_name: (value) => value && value.trim().length > 0 ? null : 'Please enter your last name.',
                dob: (value) => {
                    const val = value.trim();
                    console.log(val);
                    if (val.length === 0) {
                        return 'Please enter your date of birth.';
                    }
                },
                email: (value) => value && value.trim().length > 0 && validator.isEmail(value) ? null : 'Please enter a valid email (e.g. johndoe@gmail.com).',
                phone: (value) => value.trim().length > 0 ? null : 'Please enter a valid phone number (e.g. (123) 456-7890).'
            },
            family_members: {
                f_name: (value) => value && value.trim().length > 0 ? null : 'Please enter their first name.',
                l_name: (value) => value && value.trim().length > 0 ? null : 'Please enter their last name.',
                dob: (value) => value && value.trim().length > 0 ? null : 'Please enter their date of birth.',
                email: (value) => value && value.trim().length > 0 && validator.isEmail(value) ? null : 'Please enter a valid email (e.g. johndoe@gmail.com).',
                relationship: (value) => value.trim().length > 0 ? (value.toLowerCase().trim() === 'owner' ? 'Only the account owner can be an "owner". Please enter a different relationship.' : null) : 'Please enter your relationship to this family member.'
            }
        }
    });


    useEffect(() => {
        if (registerError && activeSection === 2 && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [registerError, activeSection]);

    const checkUsername = async () => {
        const currentUsername = form.values.username;
        if (currentUsername.length < 5) return;

        const result = await usernameExists(currentUsername);

        if (result.exists) {
            form.setFieldError(
                'username',
                'Username already taken. Try a different username.'
            );
        }
    };

    useEffect(() => {
        checkUsername();
    }, [form.values.username]);

    const prevSection = () => {
        if (activeSection === 0) {
            navigate('/');
        }
        setActiveSection((current) => (current > 0 ? current - 1 : current));
        setRegisterError('');
    };


    const loginNavigate = async () => {
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
    };

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
                "language_spoken",
                "main_family_member.f_name",
                "main_family_member.l_name",
                "main_family_member.dob",
                "main_family_member.email",
                "main_family_member.phone",
            ];

            await checkUsername();
            if (form.errors.username || form.errors.family_members) return;
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
            if (activeSection === 3) {
                setLoading(true);
                setRegisterError('');
                const householdSize = 1 + form.values.family_members.length;
                const accountData = {
                    username: form.values.username,
                    user_password: form.values.user_password,
                    canada_status: form.values.canada_status,
                    household_size: householdSize,
                    addr: form.values.addr.line1 + ', ' + form.values.addr.line2 + ', ' + form.values.addr.city + ', ' + form.values.addr.province + ', ' + form.values.addr.postal_code,
                    baby_or_pregnant: form.values.baby_or_pregnant === 'true',
                    language_spoken: form.values.language_spoken,
                    account_notes: form.values.account_notes
                };
                try {
                    const result = await createAccount(accountData);
                    if (result && result.username) {
                        // Login immediately after account creation
                        const loginResult = await login(accountData.username, accountData.user_password);
                        if (loginResult && loginResult.token) {
                            sessionStorage.setItem('token', loginResult.token);
                            sessionStorage.setItem('username', accountData.username);
                            sessionStorage.setItem('role', 'client');
                            // Add main account holder as a family member with relationship 'owner'
                            const ownerData = {
                                username: accountData.username,
                                f_name: form.values.main_family_member.f_name.trim(),
                                l_name: form.values.main_family_member.l_name.trim(),
                                dob: form.values.main_family_member.dob,
                                phone: form.values.main_family_member.phone,
                                email: form.values.main_family_member.email,
                                relationship: 'owner',
                            };
                            try {
                                await createFamilyMember(loginResult.token, ownerData);
                                console.log('created owner');
                                // Add each additional family member
                                for (const member of form.values.family_members) {
                                    const memberData = {
                                        username: accountData.username,
                                        f_name: member.f_name.trim(),
                                        l_name: member.l_name.trim(),
                                        dob: member.dob,
                                        phone: member.phone,
                                        email: member.email,
                                        relationship: member.relationship,
                                    };
                                    await createFamilyMember(loginResult.token, memberData);
                                    console.log('created family member');
                                }
                                open();
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
                } finally {
                    setLoading(false);
                }
            } else {
                setActiveSection((current) => (current < 3 ? current + 1 : current));
            }
        }
    };

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
                        <RegistrationFinished form={form} />
                    </Stepper.Completed>
                </Stepper>
                <Group justify="space-between" align='end' mt="md">
                    <Button variant="default" onClick={prevSection}>Back</Button>
                    <Button
                        onClick={nextSection}
                        color={activeSection === 3 ? 'cyan' : 'blue'}
                        loading={loading}
                    >
                        {activeSection === 2 ? 'Review' : activeSection === 3 ? 'Register' : 'Next'}
                    </Button>
                </Group>
                {activeSection === 3 && registerError && (
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
            <Modal opened={opened} onClose={close} title="Register Success" centered>
                <Text mb={10}>Select 'Continue' to view your dashboard</Text>
                <Button mt={4} color='cyan' onClick={() => { loginNavigate(); }}>Continue</Button>
            </Modal>
        </div>
    );
}