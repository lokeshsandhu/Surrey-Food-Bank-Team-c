import { Input, Radio, Group, Stack, TextInput, Text, Fieldset, Select, PasswordInput, Alert, Textarea } from '@mantine/core';
import React from 'react';
import '../styles/global-styles.css';
import '../styles/Register.css';
import { IconCircleCheckFilled } from '@tabler/icons-react';


export default function RegistrationFinished({ form }) {

    return (
        <div className='registration-section'>
            <h2 className='login-title'>Review Your Answers</h2>
            <Text size='sm'>Verify that all your answers are accurate.</Text>
            <Text size='sm'>Feel free to go to the previous sections to update your answers.</Text>
            <Stack mt={10} gap={4}>
                <h3 style={{ marginBottom: 4, marginTop: 0 }}>Eligibility Questions</h3>
                <TextInput
                    variant="filled"
                    label="1. Immigration Status"
                    value={form.values.canada_status}
                    readOnly
                    withAsterisk
                />
                <Textarea
                    variant="filled"
                    label="2. Address"
                    value={form.values.addr.line1 + ', ' + form.values.addr.line2 + ', ' + form.values.addr.city + ', ' + form.values.addr.province + ', ' + form.values.addr.postal_code}
                    readOnly
                    withAsterisk
                    autosize
                />
            </Stack>
            <hr />
            <Stack mt={10} gap={4}>
                <h3 style={{ marginBottom: 4 }}>Account and Personal Information</h3>
                <TextInput
                    variant="filled"
                    label="Username"
                    value={form.values.username}
                    readOnly
                    withAsterisk
                />
                <PasswordInput
                    label="Password"
                    value={form.values.user_password}
                    w={'45%'}
                    h={'60px'}
                    mb={4}
                    withAsterisk
                    readOnly
                />
                <Group>
                    <Textarea
                        variant="filled"
                        label="1. First Name"
                        value={form.values.main_family_member.f_name}
                        readOnly
                        withAsterisk
                        autosize
                    />
                    <Textarea
                        variant="filled"
                        label="2. Last Name"
                        value={form.values.main_family_member.l_name}
                        readOnly
                        withAsterisk
                        autosize
                    />
                </Group>
                <TextInput
                    variant="filled"
                    label="3. Date of Birth"
                    value={form.values.main_family_member.dob}
                    readOnly
                    withAsterisk
                />
                <Textarea
                    variant="filled"
                    label="4. Email"
                    value={form.values.main_family_member.email}
                    readOnly
                />
                <TextInput
                    variant="filled"
                    label="5. Phone"
                    value={form.values.main_family_member.phone}
                    readOnly
                    withAsterisk
                />
                <TextInput
                    variant="filled"
                    label="6. Does your family have babies or pregnant mothers?"
                    value={form.values.baby_or_pregnant === 'true' ? 'Yes' : 'No'}
                    readOnly
                    withAsterisk
                />
                <Textarea
                    variant="filled"
                    label="7. Language Spoken"
                    value={form.values.language_spoken}
                    readOnly
                    withAsterisk
                    autosize
                />
                <Textarea
                    variant="filled"
                    label="8. Additional Notes"
                    value={form.values.account_notes.length > 0 ? form.values.account_notes : '(Empty)'}
                    readOnly
                    autosize
                />
            </Stack>
            <hr />
            <Stack mt={10} gap={4}>
                <h3 style={{ marginBottom: 4 }}>Add Family Members</h3>
                {form.values.family_members.length === 0 && <Text>No Additional Family Members</Text>}
                {form.values.family_members.length > 0 &&
                    <Stack mt={5} gap={3}>
                        {form.values.family_members.map((member, index) => (
                            <Stack gap={3} key={index}>
                                <Text size='md' fw={700} td='underline'>Family Member {index + 1}</Text>
                                <Group>
                                    <Textarea
                                        variant="filled"
                                        label="1. First Name"
                                        value={member.f_name}
                                        readOnly
                                        withAsterisk
                                        autosize
                                    />
                                    <Textarea
                                        variant="filled"
                                        label="2. Last Name"
                                        value={member.l_name}
                                        readOnly
                                        withAsterisk
                                        autosize
                                    />
                                </Group>
                                <TextInput
                                    variant="filled"
                                    label="3. Date of Birth"
                                    value={member.dob}
                                    readOnly
                                    withAsterisk
                                />
                                <Textarea
                                    variant="filled"
                                    label="4. Email"
                                    value={member.email.length > 0 ? member.email : '(Empty)'}
                                    readOnly
                                    autosize
                                />
                                <TextInput
                                    variant="filled"
                                    label="5. Phone"
                                    value={member.phone.length > 0 ? member.phone : '(Empty)'}
                                    readOnly
                                />

                                <TextInput
                                    variant="filled"
                                    label="6. Relationship"
                                    value={member.relationship}
                                    readOnly
                                />
                                <hr style={{ color: '#737270', height: 1 }} />
                            </Stack>
                        ))}
                    </Stack>
                }
            </Stack>
            <hr />
            <Alert variant="light" color="cyan" title="Ready to Register?" icon={<IconCircleCheckFilled />}>
                Select 'Register' when you are ready to create your account.
            </Alert>
        </div>
    );
}