import React, { useEffect, useRef, useState } from 'react';
import '../styles/global-styles.css';
import '../styles/Register.css';

import logo from '../assets/surrey-food-bank-logo.png';

import AccountInformation from '../components/AccountInformation.jsx';
import AddFamilyMembers from '../components/AddFamilyMembers.jsx';
import EligibilityQuestions from '../components/EligibilityQuestions.jsx';
import RegistrationFinished from '../components/RegistrationFinished.jsx';

import { Button, Card, Group, Image, Modal, Stepper, Text, Alert, Title } from '@mantine/core';
import { isNotEmpty, matchesField, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';

import { useNavigate } from 'react-router';

import validator from 'validator';
import { createAccount, usernameExists, emailExists } from '../../api/accounts.js';
import { login, me } from '../../api/auth.js';
import { createFamilyMember } from '../../api/familyMembers.js';

import { canadaStatusOptions } from '../constants/FormOptions.js';
import { isMinAge } from '../utils/registrationHelpers.js';
import { IconCheck, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';

export default function RegisterPage() {
    const errorRef = useRef(null);
    const [activeSection, setActiveSection] = useState(0);
    const [registerError, setRegisterError] = useState('');
    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            username: '',
            user_password: '',
            confirm_password: '',
            canada_status: '',
            household_size: 0,
            baby_or_pregnant: '',
            language_spoken: '',
            account_notes: '',
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
                relationship: 'owner'
            },
            family_members: []
        },
        validateInputOnBlur: true,
        validateInputOnChange: true,
        validate: {
            username: (value) => {
                if (/\s/.test(value)) {
                    return 'Username cannot contain spaces.';
                }

                if (value.trim().length < 5) {
                    return 'Username must be at least 5 characters.';
                }
            },
            user_password: (value) => {
                if (/\s/.test(value)) {
                    return 'Password cannot contain spaces.';
                }

                if (!validator.isStrongPassword(value)) {
                    return 'Password must contain 8+ characters (incl. uppercase, lowercase, number, and symbol).';
                }
            },
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
                    if (!value) return 'Please enter your date of birth';

                    const val = value.trim();
                    if (val.length === 0) {
                        return 'Please enter your date of birth.';
                    }

                    if (!isMinAge(val)) {
                        return ' ';
                    }
                },
                email: (value) => {
                    if (value.trim().length === 0 || !validator.isEmail(value.trim())) {
                        return 'Please enter a valid email (e.g. alexdoe@gmail.com).';
                    }

                    const currentEmail = value.trim().toLowerCase();
                    const familyEmails = form.values.family_members.map(m => m.email.trim().toLowerCase());


                    // checks if this is a duplicate email within this registration form
                    const duplicates = familyEmails.filter((email, i) => email === currentEmail).length > 0;

                    if (duplicates) {
                        return 'Email is already taken. Please enter another email.';
                    }
                },
                phone: (value) => value.trim().length > 0 ? null : 'Please enter a valid phone number (e.g. (123) 456-7890).'
            },
            family_members: {
                f_name: (value) => value && value.trim().length > 0 ? null : 'Please enter their first name.',
                l_name: (value) => value && value.trim().length > 0 ? null : 'Please enter their last name.',
                dob: (value) => value && value.trim().length > 0 ? null : 'Please enter their date of birth.',
                email: (value, values, path) => {
                    if (value.trim().length === 0) {
                        return null;
                    } else if (!validator.isEmail(value.trim())) {
                        return 'Please enter a valid email (e.g. alexdoe@gmail.com).';
                    }

                    const ownerEmail = form.values.main_family_member.email.trim().toLowerCase();
                    const familyEmail = values.family_members.map(m => m.email.trim().toLowerCase());

                    const index = Number(path.split('.')[1]);
                    const currentEmail = value.trim().toLowerCase();

                    const duplicates = familyEmail.filter((email, i) =>
                        i !== index && email === currentEmail).length > 0
                        || currentEmail === ownerEmail;

                    if (duplicates) {
                        return 'Email is already taken. Please enter another email.';
                    }
                    return null;
                },
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

    const checkEmail = async (email, field_name) => {
        const currentEmail = email.trim();
        if (currentEmail.length === 0) return;

        const result = await emailExists(currentEmail, null, null);

        if (result.exists) {
            form.setFieldError(
                field_name,
                'Email already taken. Try a different email.'
            );
            return true;
        }

        return false;
    };

    useEffect(() => {
        checkUsername();
    }, [form.values.username]);

    useEffect(() => {
        checkEmail(form.values.main_family_member.email, 'main_family_member.email');
    }, [form.values.main_family_member.email]);

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
                    sessionStorage.setItem('firstTime', true);
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
            await checkEmail(form.values.main_family_member.email, 'main_family_member.email');
            if (form.errors.username || form.errors.main_family_member) return;
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

        // check that family members do not have existing emails in the client base
        const fm_emails_check = await Promise.all(
            form.values.family_members.map((member, i) =>
                checkEmail(member.email, `family_members.${i}.email`)
            )
        );

        const hasDuplicate = fm_emails_check.some(d => d === true);
        if (hasDuplicate) {
            notifications.show({
                title: 'Email is already taken',
                message: 'Please enter a different email.',
                color: 'red',
            });
        } else if (!hasErrors) {
            if (activeSection === 3) {
                setLoading(true);
                setRegisterError('');
                const householdSize = 1 + form.values.family_members.length;
                const accountData = {
                    username: form.values.username,
                    user_password: form.values.user_password,
                    canada_status: form.values.canada_status,
                    household_size: householdSize,
                    addr: form.values.addr.line1.trim() + ', ' + form.values.addr.line2.trim() + ', ' + form.values.addr.city.trim() + ', ' + form.values.addr.province + ', ' + form.values.addr.postal_code,
                    baby_or_pregnant: form.values.baby_or_pregnant === 'true',
                    language_spoken: form.values.language_spoken.trim(),
                    account_notes: form.values.account_notes.trim()
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
                                username: result.username,
                                f_name: form.values.main_family_member.f_name.trim(),
                                l_name: form.values.main_family_member.l_name.trim(),
                                dob: form.values.main_family_member.dob,
                                phone: form.values.main_family_member.phone,
                                email: form.values.main_family_member.email.trim(),
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
                                        email: member.email.trim().length > 0 ? member.email.trim() : null,
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
            <Modal
                opened={opened}
                onClose={close}
                title={<Group gap='xs'>
                    <IconCircleCheck size={30} color='green' />
                    <Title order={4}>Register Success</Title>
                </Group>}
                centered
            >
                <Text mb={10}>Congratulations, you have successfully created an account with Surrey Food Bank!</Text>
                <Text mb={10}> You will be navigated to your dashboard, where you can book appointments and edit your account information.</Text>
                <Button mt={4} color='cyan' onClick={() => { loginNavigate(); }}>Continue</Button>
            </Modal>
        </div>
    );
}
