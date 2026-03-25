import React from 'react';
import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

export default function CanadaStatusAlert() {
    return (
        <Alert
            variant="light"
            color="red"
            title="You may not be eligible for this program"
            icon={<IconInfoCircle />}
        >Visitors or international students that have stayed in Canada for less than 6 months do not qualify for this program.
        </Alert>
    );
}