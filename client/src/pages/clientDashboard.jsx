import { SimpleGrid } from '@mantine/core';
import '../styles/styles.css';
import ClientNavBar from '../components/navBar';

import { Calendar } from '@mantine/dates';
import '@mantine/dates/styles.css';

export default function ClientDashboard() {
    return (
        <div className="page">
            <ClientNavBar/>
            <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs">
                <div className="box">
                    You have a booking for June 30th, click here to edit/cancel your booking.
                </div>
                <div className="box">
                    lorem ipsum dolor sit amet
                </div>
                <div className="box">
                    lorem ipsum dolor sit amet
                </div>
            </SimpleGrid>
            <div className="calendar">
                <Calendar size="xl"/>
            </div>
        </div>
    );
        
}