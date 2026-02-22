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

import validator from 'validator'

export default function RegisterPage() {
    const [activeSection, setActiveSection] = useState(0)
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
    const prevSection = () => setActiveSection((current) => (current > 0 ? current - 1 : current));

    const form = useForm({
        initialValues: {
            username: '',
            user_password: '',
            confirm_password: '',
            canada_status: '',
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
            baby_or_pregnant: (value) => value ? null : 'Please select an option.',
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

    const nextSection = () => {
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
            setActiveSection((current) => (current < 3 ? current + 1 : current));
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
                    <Button variant="default" onClick={prevSection} disabled={activeSection === 0}>Back</Button>
                    <Button
                        onClick={nextSection}
                        color={activeSection >= 2 ? 'rgba(3, 161, 11, 1)' : 'blue'}
                    >
                        {activeSection === 2 ? 'Register' : activeSection === 3 ? 'Continue to Dashboard' : 'Next'}
                    </Button>
                </Group>
            </Card>
        </div>
    )
}
