import { Input, Radio, Group, Stack, TextInput, Text, Fieldset, Select } from '@mantine/core';
import React from 'react';
import '../styles/global-styles.css'
import '../styles/Register.css'

export default function RegistrationFinished({ form }) {

    return (
        <div>
            <h2 className='login-title'>Registration Success</h2>
            <Text size='sm'>Select the green button to view your dashboard and book appointments.</Text>
        </div>
    )
}