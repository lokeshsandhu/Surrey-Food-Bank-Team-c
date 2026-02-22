import { Input, Text, Group, TextInput, Fieldset, Select, PasswordInput, Stack, Radio, NumberInput } from '@mantine/core';
import { DateInput } from '@mantine/dates'
import validator from 'validator'
import { IMaskInput } from 'react-imask'

import '../styles/global-styles.css'
import '../styles/Register.css'
import { useState } from 'react';

export default function AccountInformation({ form }) {
    return (
        <div>
            <h2 className='login-title'>Account Information</h2>
            <Text size='sm'>Please enter a username and password to set up your account.</Text>
            <Group className='registration-section'>
                <TextInput
                    label="Username"
                    placeholder="e.g. john123"
                    key={form.key('username')}
                    {...form.getInputProps('username')}
                    withAsterisk
                    w={'60%'}
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
                        key={form.key('family_members.0.dob')}
                        {...form.getInputProps('main_family_member.dob')}
                        withAsterisk
                        w={'30%'}
                    />
                    <TextInput
                        label="4. Email"
                        placeholder="e.g. alexdoe@gmail.com"
                        key={form.key('family_members.0.email')}
                        {...form.getInputProps('main_family_member.email')}
                        withAsterisk
                        w={'45%'}
                    />
                    <TextInput
                        label="5. Phone"
                        placeholder="e.g. (123) 456-7890"
                        key={form.key('family_members.0.phone')}
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
                </Stack>
            </Group>
        </div>
    )
}