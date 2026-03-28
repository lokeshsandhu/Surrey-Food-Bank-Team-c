import React from 'react';
import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import '../../styles/global-styles.css';
import ContactText from '../contactText';

export default function CityAlert() {
    return (
        <Alert
            variant="light"
            color="red"
            title="You are not be eligible for this program (Ineligible City)"
            icon={<IconInfoCircle />}
        >Clients must reside in the Surrey, North Delta, or Cloverdale, North of 40th Avenue.
            <ContactText />
        </Alert>
    );
}