import { TextInput, Text, Group, Button, Stack, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IMaskInput } from 'react-imask';
import React from 'react';
import '../styles/global-styles.css';
import '../styles/Register.css';
import { FMRelationshipOptions } from '../constants/FormOptions';

export default function AddFamilyMembers({ form }) {
    const addFamilyMember = () => {
        form.insertListItem('family_members',
            {
                f_name: '',
                l_name: '',
                dob: null,
                phone: '',
                email: '',
                relationship: ''
            });
    };

    return (
        <div className='registration-section'>
            <h2 className='login-title'>Add Family Members</h2>
            <Text size='sm' fw={600}>Please add any additional family members you would like to register under your account.</Text>
            <Text size='sm'>If this does not apply to you, you may skip this section.</Text>
            <Stack className='registration-section'>
                {form.getValues().family_members.map((member, index) => (
                    <Group key={index}>
                        <Group w='100%' justify='space-between'>
                            <Text size='md' fw={600} td='underline'>Family Member {index + 1}</Text>
                            <Button
                                variant="light"
                                color="red"
                                size='compact-sm'
                                justify='end'
                                onClick={() => { form.removeListItem('family_members', index); }}
                            >
                                Remove</Button>
                        </Group>
                        <Stack w='100%'>
                            <Group>
                                <TextInput
                                    label="1. First Name"
                                    placeholder="e.g. Alex"
                                    key={form.key(`family_members.${index}.f_name`)}
                                    {...form.getInputProps(`family_members.${index}.f_name`)}
                                    withAsterisk
                                    w={'45%'}
                                />
                                <TextInput
                                    label="2. Last Name"
                                    placeholder="e.g. Doe"
                                    key={form.key(`family_members.${index}.l_name`)}
                                    {...form.getInputProps(`family_members.${index}.l_name`)}
                                    withAsterisk
                                    w={'45%'}
                                />
                            </Group>
                            <DateInput
                                label="3. Date of Birth"
                                placeholder="YYYY MM DD"
                                valueFormat='YYYY MM DD'
                                maxDate={new Date()}
                                key={form.key(`family_members.${index}.dob`)}
                                {...form.getInputProps(`family_members.${index}.dob`)}
                                withAsterisk
                                w={'30%'}
                            />
                            <TextInput
                                label="4. Email"
                                placeholder="e.g. alexdoe@gmail.com"
                                key={form.key(`family_members.${index}.email`)}
                                {...form.getInputProps(`family_members.${index}.email`)}
                                w={'45%'}
                            />
                            <TextInput
                                label="5. Phone"
                                placeholder="e.g. (123) 456-7890"
                                key={form.key(`family_members.${index}.phone`)}
                                {...form.getInputProps(`family_members.${index}.phone`)}
                                component={IMaskInput}
                                mask='(000) 000-0000'
                                w={'45%'}
                            />

                            <Select
                                label='6. Relationship to Account Owner'
                                placeholder='Select Relationship'
                                description='e.g. if this family member is your mother, select the "Parent" option.'
                                data={FMRelationshipOptions}
                                key={form.key(`family_members.${index}.relationship`)}
                                {...form.getInputProps(`family_members.${index}.relationship`)}
                                withAsterisk
                                w={'45%'}
                            />
                        </Stack>
                    </Group>
                ))}
            </Stack>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'end' }}>
                <Button onClick={() => addFamilyMember()} my={20}>Add Family Member</Button>
            </div>
        </div>
    );
}