import { Button, SimpleGrid, LoadingOverlay, Notification } from '@mantine/core';
import { getTimeRange, DatePicker, TimeGrid } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';

import '../styles/styles.css';

import ClientNavBar from '../components/navBar';
import { useState } from 'react';
import { notifications, Notifications } from '@mantine/notifications';

const excludedDays = [1, 3, 5, 6]; // Exclude specific days (0 = Monday, ..., 6 = Sunday)

export default function ClientDashboard() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [processingBooking, setProcessingBooking] = useState(false);
    const [loadingTimeGrid, setLoadingTimeGrid] = useState(false);
    const [bookedTimes, setBookedTimes] = useState([]);

    const handleBooking = () => {
        if (selectedDate && selectedTime) {
            // TODO: Send booking information to the backend and handle the response
            setProcessingBooking(true);
            console.log('Booking date:', selectedDate);
            console.log('Booking time:', selectedTime);

            // Delete later
            setTimeout(() => {
                setProcessingBooking(false);
                notifications.show({
                    title: 'Booking Confirmed',
                    message: `Your appointment is booked for ${selectedDate} at ${selectedTime}`,
                    color: 'green',
                });
            }, 2000);

            // Enter code here
        }
    };

    const handleAvailableTimes = (date) => {
        // TODO: Fetch available times for the selected date from the backend and update the state
        setSelectedDate(date);
        setLoadingTimeGrid(true);
        console.log('Selected date:', date);

        // Delete later
        setTimeout(() => {
            setLoadingTimeGrid(false);
        }, 2000);

        // Enter code here
    }

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
            <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs">

                <div className="calendar">
                    <DatePicker
                        size="xl"
                        onChange={handleAvailableTimes}
                        firstDayOfWeek={0}
                        excludeDate={(date) => excludedDays.includes(new Date(date).getDay())}
                        hideOutsideDates
                    />
                </div>

                <div className="time-grid">

                    <LoadingOverlay visible={loadingTimeGrid} overlayProps={{ radius: "sm", blur: 2 }} />

                    <TimeGrid
                        data={getTimeRange({ startTime: '9:15', endTime: '11:15', interval: '00:15' })}
                        simpleGridProps={{
                            type: 'container',
                            cols: { base: 3 },
                            spacing: 'lg',
                        }}
                        format="12h"
                        withSeconds={false}
                        size="lg"
                        disableTime={bookedTimes}
                        onChange={setSelectedTime}
                        disabled={selectedDate === null}
                    />

                    <div className="booking-button">
                        <Button size="lg" onClick={handleBooking} loading={processingBooking}>
                            Book Appointment
                        </Button>
                    </div>
                </div>

            </SimpleGrid>
            <Notifications/>
        </div>
    );
        
}