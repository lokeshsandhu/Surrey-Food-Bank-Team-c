import React from 'react';
import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import '../../styles/global-styles.css';
import ContactText from '../contactText';

export default function AgeAlert() {
    return (
        <Alert
            variant="light"
            color="red"
            title="You are not be eligible for this program (Ineligible Age)"
            icon={<IconInfoCircle />}
        >Clients must be at least 18 years old.
            <ContactText />
        </Alert>
    );
}