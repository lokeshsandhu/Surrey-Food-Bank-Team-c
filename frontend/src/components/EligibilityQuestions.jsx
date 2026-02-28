import { Input, Radio, Group, Stack, TextInput, Text, Fieldset, Select, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react'
import React from 'react';
import '../styles/global-styles.css'
import '../styles/Register.css'

export default function ElegibilityQuestions({ form }) {

    return (
        <Group>
            <h2 className='login-title'>Eligibility Questions</h2>
            <Radio.Group
                name="status-in-canada"
                label="1. Immigration Status"
                withAsterisk
                className='question-section'
                key={form.key('canada_status')}
                {...form.getInputProps('canada_status')}
            >
                <Text size='sm' mb={3}>Please select the option that best describes your status in Canada. </Text>
                <Text size='sm' my={0} fs='italic'>Note: Visitors or international students that have stayed in Canada for less than 6 months do not qualify for this program.</Text>
                <Group mt="xs">
                    <Radio value="Canadian Citizen" label="Canadian Citizen" />
                    <Radio value="Permanent Resident" label="Permanent Resident" />
                    <Radio value="International Student > 6 months" label="International student with more than 6 months in Canada" />
                    <Radio value="ineligible" label="Visitor or International student with less than 6 months in Canada (ineligible)" />
                    <Radio value="Other" label="Other" />
                </Group>
            </Radio.Group>
            {form.getValues().canada_status === 'ineligible' &&
                <Alert variant="light" color="red" title="You may not be eligible for this program" icon={<IconInfoCircle />}></Alert>
            }
            <Fieldset legend="2. Address" variant='unstyled'>
                <Text size='sm' my={0}>In order to be eligible for the program, clients must reside within Surrey, North Delta, or Cloverdale, north of 40th Avenue.</Text>
                <Text>Please enter your residential address.</Text>
                <Group className='address' my={10}>
                    <TextInput
                        label="Address Line 1"
                        placeholder="e.g. 13478 78th Ave"
                        withAsterisk
                        key={form.key('addr.line1')}
                        {...form.getInputProps('addr.line1')}
                    />
                    <TextInput
                        label="Address Line 2 (optional)"
                        placeholder="e.g. Apt. 101"
                        key={form.key('addr.line2')}
                        {...form.getInputProps('addr.line2')}
                    />
                </Group>
                <Group>
                    <TextInput
                        label="City"
                        placeholder="e.g. Surrey"
                        withAsterisk
                        key={form.key('addr.city')}
                        {...form.getInputProps('addr.city')}
                    />
                    <TextInput
                        label="Province"
                        placeholder="e.g. BC"
                        withAsterisk
                        key={form.key('addr.province')}
                        {...form.getInputProps('addr.province')}
                    />
                    <TextInput
                        label="Postal Code"
                        placeholder="e.g. V1M 3B5"
                        withAsterisk
                        key={form.key('addr.postal_code')}
                        {...form.getInputProps('addr.postal_code')}
                    />
                </Group>
            </Fieldset>
        </Group>
    )
}