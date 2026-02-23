import { Button, SimpleGrid, LoadingOverlay, Notification } from '@mantine/core';
import { getTimeRange, DatePicker, TimeGrid } from '@mantine/dates';
import React, { useEffect } from 'react';
import '../styles/styles.css';

import { ClientNavBar } from '../components/navBar.jsx';
import { useState } from 'react';
import { notifications, Notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { bookAppointment, getAppointmentsInDateRange } from '../../api/appointments.js';
import { me } from '../../api/auth.js';

const excludedDays = [1, 3, 5, 6]; // Exclude specific days (0 = Monday, ..., 6 = Sunday)

export default function ClientDashboard() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [processingBooking, setProcessingBooking] = useState(false);
    const [loadingTimeGrid, setLoadingTimeGrid] = useState(false);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [bookedTimes, setBookedTimes] = useState([]);

    const [myUsername, setMyUserName] = useState('');

    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();

    if (!token) {
        navigate('/');
        return null;
    }

    const handleBooking = async () => {
        if (selectedDate && selectedTime) {
            // TODO: Send booking information to the backend and handle the response
            setProcessingBooking(true);

            const data = { appt_date: selectedDate, start_time: selectedTime };
            const res = await bookAppointment(token, data);

            if (res && res.success) {
                notifications.show({
                    title: 'Success',
                    message: 'Appointment booked successfully',
                    color: 'green',
                });
                handleAvailableTimes(selectedDate); // Refresh available times after booking
            } else {
                notifications.show({
                    title: 'Error',
                    message: res?.error || 'Failed to book appointment',
                    color: 'red',
                });
            }

            setProcessingBooking(false);

        }
    };

    const handleAvailableTimes = async (date) => {
        // TODO: Fetch available times for the selected date from the backend and update the state
        setSelectedDate(date);
        setLoadingTimeGrid(true);

        try {
            const timeslots = await getAppointmentsInDateRange(token, date, date);
            const takenTimes = timeslots.filter(slot => slot.username !== null);
            setAvailableTimes(timeslots.map(appointment => appointment.start_time));
            setBookedTimes(takenTimes.map(appointment => appointment.start_time));
        } catch (error) {
            console.error('Error fetching booked times:', error);
        } finally {
            setLoadingTimeGrid(false);
        }
    }

    useEffect(() => {
        const getUserName = async () => {
            const userInfo = await me(token);
            setMyUserName(userInfo.username)
        }

        getUserName();
    }, [])

    return (
        <div className="page">
            <ClientNavBar />
            <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs">
                <div className="box">
                    You have a booking for June 30th, click here to edit/cancel your booking.
                </div>
                <div className="box">
                    lorem ipsum dolor sit amet
                    {/* TODO: Change this navigation because the user can just enter someone else's account with the username */}
                    <Button justify='end' mt={20} onClick={() => navigate(`/clientDashboard/account/${myUsername}`)}>
                        View My Account
                        </Button>

                </div>
                <div className="box">
                    lorem ipsum dolor sit amet
                </div>
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs" style={{ marginBottom: '60px' }}>

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
                        data={availableTimes}
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
                        <Button size="lg" onClick={handleBooking} loading={processingBooking} disabled={!selectedDate || !selectedTime}>
                            Book Appointment
                        </Button>
                    </div>
                </div>

            </SimpleGrid>
            <Button style={{ marginLeft: '20px' }} size="lg" onClick={() => {
                sessionStorage.removeItem('token');
                notifications.show({
                    title: 'Logged out',
                    message: 'You have been successfully logged out.',
                    color: 'green',
                });
                navigate('/');
            }}>
                Logout
            </Button>
        </div>
    );

}