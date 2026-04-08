import { Title, Text, Stack, TextInput, Radio, Group, Fieldset, Select, Button, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import React, { useEffect, useState } from "react";
import { emailExists, getAccount, updateAccount } from "../../api/accounts";
import { getFamilyMembers, updateFamilyMember } from "../../api/familyMembers";
import { useForm, isNotEmpty } from "@mantine/form";
import validator from 'validator';
import dayjs from 'dayjs';
import { IMaskInput } from 'react-imask';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';
import { provinceOptions, canadaStatusOptions } from "../constants/FormOptions";
import { splitAddress } from "../utils/displayHelpers";
import { CHARLIMITS } from "../constants/Validation";
import { capitalize } from "../utils/displayHelpers";
import CanadaStatusAlert from "./alerts/CanadaStatusAlert";
import CityAlert from "./alerts/CityAlert";
import ProvinceAlert from "./alerts/ProvinceAlert";
import { isMinAge } from "../utils/registrationHelpers";
import AgeAlert from "./alerts/AgeAlert";

export default function AccountInformationTab({ clientUsername }) {
    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();
    const role = sessionStorage.getItem('role');
    const username = sessionStorage.getItem("username");
    const [ownerId, setOwnerId] = useState(null);
    const location = useLocation();

    if (!token) {
        navigate('/');
        return null;
    }

    if (username !== clientUsername && role !== 'admin') {
        navigate(`/clientDashboard/account/${username}`);
    }

    const form = useForm({
        initialValues: {
            accountInformation: {
                username: '',
                canada_status: '',
                household_size: 0,
                addr: {
                    line1: '',
                    line2: '',
                    city: '',
                    province: '',
                    postal_code: ''
                },
                baby_or_pregnant: '',
                language_spoken: '',
                account_notes: ''
            },
            accountOwner: {
                username: '',
                id: null,
                f_name: '',
                l_name: '',
                dob: null,
                phone: '',
                email: ''
            }
        },
        validateInputOnBlur: true,
        validateInputOnChange: true,
        validate: {
            accountInformation: {
                username: (value) => value.trim().length < 5 ? 'Username must be at least 5 characters' : null,
                canada_status: (value) => value ? null : 'Please select an option.',
                baby_or_pregnant: (value) => value && value.trim().length > 0 ? null : 'Please select an option.',
                language_spoken: isNotEmpty('Please enter your primary language.'),
                addr: {
                    line1: isNotEmpty('Please enter your address.'),
                    city: isNotEmpty('Please enter your city.'),
                    province: isNotEmpty('Please enter your province.'),
                    postal_code: (value) => value ? (validator.isPostalCode(value, 'CA') ? null : 'Please enter a valid postal code (e.g. V1M 3B5).') : 'Please enter your postal code.'
                },
            },
            accountOwner: {
                f_name: (value) => value && value.trim().length > 0 ? null : 'Please enter your first name.',
                l_name: (value) => value && value.trim().length > 0 ? null : 'Please enter your last name.',
                dob: (value) => value && value.trim().length > 0 ? null : 'Please enter your date of birth.',
                email: (value) => value && value.trim().length > 0 && validator.isEmail(value) ? null : 'Please enter a valid email (e.g. alexdoe@gmail.com).',
                phone: (value) => value.trim().length === 14 ? null : 'Please enter a valid phone number with exactly 10 digits (e.g. (123) 456-7890).'
            }
        }
    });

    const checkIsCityEligible = () => {
        const city = form.values.accountInformation.addr.city.trim().toLowerCase();

        return city.length === 0
            || city === 'surrey'
            || city === 'north delta';
    };

    const checkIsProvinceEligible = () => {
        const province = form.values.accountInformation.addr.province.trim().toUpperCase();
        return province.length === 0 || province === 'BC';
    };

    // check if email exists in database
    // duplicate error if exists: true AND is_member_email: false
    const checkEmail = async () => {
        const currentEmail = form.values.accountOwner.email.trim();
        if (currentEmail.length === 0) return;

        const result = await emailExists(currentEmail, clientUsername, form.values.accountOwner.id);

        if (result.exists && result.is_family_member !== true) {
            form.setFieldError(
                'accountOwner.email',
                'Email already taken. Try a different email.'
            );
            return true;
        }

        return false;
    };

    const getAccountInformation = async () => {
        const result = await getAccount(token, clientUsername);
        const familyMembers = await getFamilyMembers(token, clientUsername);
        const ownerTemp = familyMembers.filter(member => member.relationship === 'owner');
        const owner = ownerTemp[0];
        const address = splitAddress(result.addr);
        // TODO: Rewrite (better practices)
        if (result && owner) {
            setOwnerId(owner.id);
            form.setValues({
                accountInformation: {
                    username: result.username,
                    canada_status: result.canada_status,
                    household_size: result.household_size,
                    addr: {
                        line1: capitalize(address.line1),
                        line2: capitalize(address.line2),
                        city: capitalize(address.city),
                        province: address.province,
                        postal_code: address.postal_code
                    },
                    baby_or_pregnant: result.baby_or_pregnant === true ? 'true' : 'false',
                    language_spoken: capitalize(result.language_spoken),
                    account_notes: capitalize(result.account_notes)
                },
                accountOwner: {
                    id: owner.id,
                    f_name: capitalize(owner.f_name),
                    l_name: capitalize(owner.l_name),
                    dob: owner.dob,
                    phone: owner.phone,
                    email: owner.email
                }
            });
        }
    };

    const splitAddress = (address) => {
        const addrParts = address.split(', ').map(p => p.trim());

        return {
            line1: addrParts[0] ?? '',
            line2: addrParts[1] ?? '',
            city: addrParts[2] ?? '',
            province: addrParts[3] ?? '',
            postal_code: addrParts[4] ?? '',
        };
    };



    const updateAccountInformation = async () => {
        const fieldsToValidate = [
            "accountOwner.f_name",
            "accountOwner.l_name",
            "accountOwner.dob",
            "accountOwner.email",
            "accountOwner.phone",
            "accountInformation.addr.line1",
            "accountInformation.addr.city",
            "accountInformation.addr.province",
            "accountInformation.addr.postal_code",
            "accountInformation.baby_or_pregnant",
            "accountInformation.language_spoken",
        ];

        let hasErrors = false;
        fieldsToValidate.forEach((field) => {
            const result = form.validateField(field);
            if (result.hasError) {
                hasErrors = true;
            }
        });

        const hasDupEmail = await checkEmail();
        if (form.errors.accountOwner) return;

        if (hasDupEmail) {
            notifications.show({
                title: 'Email is already taken',
                message: 'Please enter a different email.',
                color: 'red',
            });
        } else if (!hasErrors) {
            const accountInfo = form.values.accountInformation;
            const ownerInfo = form.values.accountOwner;
            const accountData = {
                username: accountInfo.username,
                canada_status: accountInfo.canada_status,
                addr: accountInfo.addr.line1.trim() + ', ' + accountInfo.addr.line2.trim() + ', ' + accountInfo.addr.city.trim() + ', ' + accountInfo.addr.province + ', ' + accountInfo.addr.postal_code,
                baby_or_pregnant: accountInfo.baby_or_pregnant === 'true',
                language_spoken: accountInfo.language_spoken.trim(),
                account_notes: accountInfo.account_notes.trim()
            };
            const ownerData = {
                f_name: ownerInfo.f_name.trim(),
                l_name: ownerInfo.l_name.trim(),
                dob: ownerInfo.dob,
                phone: ownerInfo.phone,
                email: ownerInfo.email,
            };
            try {
                const accountResult = await updateAccount(token, clientUsername, accountData);
                const ownerResult = await updateFamilyMember(token, clientUsername, ownerId, ownerData);
                notifications.show({
                    title: 'Saved',
                    message: 'Your changes to Account Information have been saved.',
                    color: 'green',
                });
            } catch (err) {
                notifications.show({
                    title: 'Error',
                    message: 'There was a problem when saving your changes. Please try again.',
                    color: 'green',
                });
            } finally {
                await getAccountInformation();
            }
        } else {
            notifications.show({
                title: 'Invalid or Missing Fields',
                message: 'Please fill all the required fields (*).',
                color: 'red',
            });
        }
    };

    useEffect(() => {
        getAccountInformation();
    }, [location.pathname]);

    useEffect(() => {
        checkEmail();
    }, [form.values.accountOwner.email]);

    return (
        <div>
            <Title order={2}>Account Information</Title>
            {form.values.accountInformation.username === null !== null &&
                (<Stack mt={15} gap={10} mr={10}>
                    <TextInput
                        variant='unstyled'
                        label="Username"
                        placeholder="e.g. john123"
                        value={form.values.accountInformation.username}
                        readOnly
                    />
                    <Textarea
                        label="First Name"
                        placeholder="e.g. Alex"
                        key={form.key('accountOwner.f_name')}
                        {...form.getInputProps('accountOwner.f_name')}
                        withAsterisk
                        autosize
                        w={'45%'}
                        maxLength={CHARLIMITS.name}
                    />
                    <Textarea
                        label="Last Name"
                        placeholder="e.g. Doe"
                        key={form.key('accountOwner.l_name')}
                        {...form.getInputProps('accountOwner.l_name')}
                        withAsterisk
                        maxLength={CHARLIMITS.name}
                        w={'45%'}
                        autosize
                    />
                    <DateInput
                        label="Date of Birth"
                        placeholder="YYYY-MM-DD"
                        valueFormat='YYYY-MM-DD'
                        {...form.getInputProps('accountOwner.dob')}
                        withAsterisk
                        maxDate={dayjs()}
                        defaultDate={dayjs()}
                        minDate={dayjs().subtract(120, 'year').toDate()}
                        w={'45%'}
                    />
                    {!isMinAge(form.values.accountOwner.dob) && <AgeAlert />}
                    <Textarea
                        label="Email"
                        placeholder="e.g. alexdoe@gmail.com"
                        key={form.key('accountOwner.email')}
                        {...form.getInputProps('accountOwner.email')}
                        withAsterisk
                        onBlur={async (event) => {
                            form.getInputProps('accountOwner.email').onBlur(event);
                            await checkEmail();
                        }}
                        w={'45%'}
                        autosize
                        maxLength={CHARLIMITS.email}
                    />
                    <TextInput
                        label="Phone"
                        placeholder="e.g. (123) 456-7890"
                        key={form.key('accountOwner.phone')}
                        {...form.getInputProps('accountOwner.phone')}
                        onAccept={(value) => form.setFieldValue(`accountOwner.phone`, value)}
                        component={IMaskInput}
                        mask='(000) 000-0000'
                        withAsterisk
                        w={'45%'}
                    />
                    <Fieldset variant='unstyled' my={10}>
                        <Group className='address' my={10}>
                            <Textarea
                                label="Address Line 1"
                                placeholder="e.g. 13478 78th Ave"
                                withAsterisk
                                key={form.key('accountInformation.addr.line1')}
                                {...form.getInputProps('accountInformation.addr.line1')}
                                w={'100%'}
                                maxLength={CHARLIMITS.addr}
                                autosize
                            />
                            <Textarea
                                label="Address Line 2 (optional)"
                                placeholder="e.g. Apt. 101"
                                key={form.key('accountInformation.addr.line2')}
                                {...form.getInputProps('accountInformation.addr.line2')}
                                w={'100%'}
                                maxLength={CHARLIMITS.addr}
                                autosize
                            />
                        </Group>
                        <Group>
                            <TextInput
                                label="City"
                                placeholder="e.g. Surrey"
                                withAsterisk
                                key={form.key('accountInformation.addr.city')}
                                {...form.getInputProps('accountInformation.addr.city')}
                                maxLength={CHARLIMITS.city}
                            />
                            <Select
                                label='Province'
                                placeholder='Select Province'
                                data={provinceOptions}
                                key={form.key('accountInformation.addr.province')}
                                {...form.getInputProps('accountInformation.addr.province')}
                                withAsterisk
                                w={150}

                            />
                            <TextInput
                                label="Postal Code"
                                placeholder="e.g. V1M 3B5"
                                component={IMaskInput}
                                mask='a0a 0a0'
                                definitions={{ a: /[A-Za-z]/ }}
                                prepare={(str) => str.toUpperCase()}
                                withAsterisk
                                key={form.key('accountInformation.addr.postal_code')}
                                {...form.getInputProps('accountInformation.addr.postal_code')}
                            />
                            {!checkIsCityEligible() && <CityAlert />}
                            {!checkIsProvinceEligible() && <ProvinceAlert />}
                        </Group>
                    </Fieldset>
                    <Radio.Group
                        name="status-in-canada"
                        label="Immigration Status"
                        withAsterisk
                        className='question-section'
                        key={form.key('accountInformation.canada_status')}
                        {...form.getInputProps('accountInformation.canada_status')}
                    >
                        <Text size='sm' mb={3}>Please select the option that best describes your status in Canada. </Text>
                        <Group mt="xs">
                            <Radio
                                value={canadaStatusOptions.citizen.value}
                                label={canadaStatusOptions.citizen.label}
                            />
                            <Radio
                                value={canadaStatusOptions.permanentResident.value}
                                label={canadaStatusOptions.permanentResident.label}
                            />
                            <Radio
                                value={canadaStatusOptions.intlStudentMoreThan6.value}
                                label={canadaStatusOptions.intlStudentMoreThan6.label}
                            />
                            <Radio
                                value={canadaStatusOptions.visitorIntlStudentLessThan6.value}
                                label={canadaStatusOptions.visitorIntlStudentLessThan6.label}
                            />
                            <Radio
                                value={canadaStatusOptions.other.value}
                                label={canadaStatusOptions.other.label}
                            />
                        </Group>
                    </Radio.Group>
                    {
                        (
                            form.values.accountInformation.canada_status === canadaStatusOptions.visitorIntlStudentLessThan6.value ||
                            form.values.accountInformation.canada_status ===
                            canadaStatusOptions.other.value
                        ) &&
                        <CanadaStatusAlert />
                    }
                    <Radio.Group
                        name="baby_or_pregnant"
                        label="Does your family have any babies or pregnant mothers?"
                        description="Families with babies and pregnant mothers qualify for the Tiny Bundles Program that happen on Wednesdays."
                        withAsterisk
                        className='question-section'
                        key={form.key('accountInformation.baby_or_pregnant')}
                        {...form.getInputProps('accountInformation.baby_or_pregnant')}
                        mt={10}
                    >
                        <Group mt="xs">
                            <Radio value='true' label="Yes" />
                            <Radio value='false' label="No" />
                        </Group>
                    </Radio.Group>
                    <Textarea
                        label="Language Spoken"
                        placeholder="e.g. English, French, Mandarin, etc."
                        key={form.key('accountInformation.language_spoken')}
                        {...form.getInputProps('accountInformation.language_spoken')}
                        withAsterisk
                        mb={10}
                        autosize
                        maxLength={CHARLIMITS.openTextField}
                    />
                    <Textarea
                        label="Additional Notes (optional)"
                        placeholder="Enter any additional information"
                        key={form.key('accountInformation.account_notes')}
                        {...form.getInputProps('accountInformation.account_notes')}
                        mb={10}
                        autosize
                        maxLength={CHARLIMITS.openTextField}
                    />
                </Stack>)}
            {form.values.accountInformation.username === null && <Text>Error loading account Information...</Text>}
            <div style={{ display: 'flex', width: '100%', justifyContent: 'end', marginTop: '10px' }}>
                <Button onClick={updateAccountInformation}>Save</Button>
            </div>
        </div>
    );
}
