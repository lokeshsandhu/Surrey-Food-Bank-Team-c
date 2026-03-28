import React from 'react';
import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import '../../styles/global-styles.css';
import ContactText from '../contactText';

export default function ProvinceAlert() {
    return (
        <Alert
            variant="light"
            color="red"
            title="You are not be eligible for this program (Ineligible Province)"
            icon={<IconInfoCircle />}
        >Clients must reside in British Columbia (BC), Canada.
            <ContactText />
        </Alert>
    );
}