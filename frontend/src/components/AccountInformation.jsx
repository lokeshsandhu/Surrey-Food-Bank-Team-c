import { Input, Text, Group, TextInput, Fieldset, Select, PasswordInput, Stack, Radio, NumberInput } from '@mantine/core';
import { DateInput } from '@mantine/dates'
import validator from 'validator'
import { IMaskInput } from 'react-imask'
import React from 'react';
import '../styles/global-styles.css'
import '../styles/Register.css'
import { useState } from 'react';
import dayjs from 'dayjs';
import { usernameExists } from '../../api/accounts';

export default function AccountInformation({ form }) {

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
    return (
        <div>
            <div style={{ width: '100%' }}>
                <h2 className='login-title'>Account Information</h2>
                <Text size='sm'>Please enter a username and password to set up your account.</Text>
            </div>
            <Group className='registration-section'>
                <TextInput
                    label="Username"
                    placeholder="e.g. john123"
                    key={form.key('username')}
                    {...form.getInputProps('username')}
                    withAsterisk
                    w={'60%'}
                    onBlur={async (event) => {
                        form.getInputProps('username').onBlur(event);

                        await checkUsername();
                    }}
                />
                <PasswordInput
                    label="Password"
                    placeholder="Enter password"
                    key={form.key('user_password')}
                    {...form.getInputProps('user_password')}
                    w={'45%'}
                    h={'60px'}
                    withAsterisk
                />
                <PasswordInput
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    key={form.key('confirm_password')}
                    {...form.getInputProps('confirm_password')}
                    w={'45%'}
                    h={'60px'}
                    withAsterisk
                />
            </Group>
            <h2 className='subsection-title login-title'>Personal Information</h2>
            <Text size='sm'>Please enter the following information about yourself.</Text>
            <Group className='registration-section'>
                <Stack w='100%'>
                    <Group>
                        <TextInput
                            label="1. First Name"
                            placeholder="e.g. Alex"
                            key={form.key('main_family_member.f_name')}
                            {...form.getInputProps('main_family_member.f_name')}
                            withAsterisk
                            w={'45%'}
                        />
                        <TextInput
                            label="2. Last Name"
                            placeholder="e.g. Doe"
                            key={form.key('main_family_member.l_name')}
                            {...form.getInputProps('main_family_member.l_name')}
                            withAsterisk
                            w={'45%'}
                        />
                    </Group>
                    <DateInput
                        label="3. Date of Birth"
                        placeholder="YYYY MM DD"
                        valueFormat='YYYY MM DD'
                        {...form.getInputProps('main_family_member.dob')}
                        withAsterisk
                        w={'30%'}
                        maxDate={dayjs()}
                        defaultDate={dayjs()}
                        minDate={dayjs().subtract(100, 'year').toDate()}
                    />
                    <TextInput
                        label="4. Email"
                        placeholder="e.g. alexdoe@gmail.com"
                        key={form.key('main_family_member.email')}
                        {...form.getInputProps('main_family_member.email')}
                        withAsterisk
                        w={'45%'}
                    />
                    <TextInput
                        label="5. Phone"
                        placeholder="e.g. (123) 456-7890"
                        key={form.key('main_family_member.phone')}
                        {...form.getInputProps('main_family_member.phone')}
                        component={IMaskInput}
                        mask='(000) 000-0000'
                        withAsterisk
                        w={'45%'}
                    />
                    <Radio.Group
                        name="baby_or_pregnant"
                        label="6. Does your family have any babies or pregnant mothers?"
                        description="Families with babies and pregnant mothers qualify for the Tiny Bundles Program that happen on Wednesdays."
                        withAsterisk
                        className='question-section'
                        key={form.key('baby_or_pregnant')}
                        {...form.getInputProps('baby_or_pregnant')}
                    >
                        <Group mt="xs">
                            <Radio value='true' label="Yes" />
                            <Radio value='false' label="No" />
                        </Group>
                    </Radio.Group>
                    <TextInput
                        label="7. Language Spoken"
                        placeholder="e.g. English, French, Mandarin, etc."
                        key={form.key('language_spoken')}
                        {...form.getInputProps('language_spoken')}
                        withAsterisk
                        w={'45%'}
                    />
                    <TextInput
                        label="8. Additional Notes (optional)"
                        placeholder="Enter any additional information"
                        key={form.key('account_notes')}
                        {...form.getInputProps('account_notes')}
                    />
                </Stack>
            </Group>
        </div>
    )
}