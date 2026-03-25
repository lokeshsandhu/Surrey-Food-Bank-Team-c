import React from 'react';
import { Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import '../styles/global-styles.css';
import { sfb_email, sfb_phone_number } from '../constants/Contacts';

export default function ContactText() {
    return (
        <Text size='xs' mt={10}>
            For any questions, please contact Surrey Food Bank at <a
                href={`tel:${sfb_phone_number}`}>
                {sfb_phone_number}
            </a> or <a
                href={`mailto:${sfb_email}`}>
                {sfb_email}
            </a>
        </Text>
    );
}