import { Input, Radio, Group, Stack, TextInput, Text, Fieldset, Select } from '@mantine/core';

import '../styles/global-styles.css'
import '../styles/Register.css'

export default function ElegibilityQuestions({ form }) {

    return (
        <Group>
            <h2 className='login-title'>Eligibility Questions</h2>
            <Radio.Group
                name="status-in-canada"
                label="1. Status in Canada"
                description="Please select the option that best describes your status in Canada. Visitors or international students that have stayed in Canada for less than six months do not qualify for this program."
                withAsterisk
                className='question-section'
                key={form.key('canada_status')}
                {...form.getInputProps('canada_status')}
            >
                <Group mt="xs">
                    <Radio value="Canadian Citizen" label="Canadian Citizen" />
                    <Radio value="Permanent Resident" label="Permanent Resident" />
                    <Radio value="International Student > 6 months" label="International student with more than 6 months in Canada" />
                    <Radio value="ineligible" label="Visitor or international student with less than 6 months in Canada (ineligible)" />
                    <Radio value="Other" label="Other" />
                </Group>
            </Radio.Group>
            <Fieldset legend="2. Address" variant='unstyled'>
                <Text size='sm' my={0}>In order to be eligible for the program, clients must reside within the Surrey and North Delta catchment area. Please enter your residential address if you qualify.</Text>
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