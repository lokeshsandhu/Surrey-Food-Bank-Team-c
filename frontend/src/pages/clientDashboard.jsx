import { Button, SimpleGrid, LoadingOverlay, Grid, ScrollArea, Modal, Center } from '@mantine/core';
import { getTimeRange, DatePicker, TimeGrid } from '@mantine/dates';
import React, { useEffect } from 'react';
import '../styles/styles.css';

import { ClientNavBar } from '../components/navBar.jsx';
import { useState } from 'react';
import { notifications, Notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { bookAppointment, getAppointmentsInDateRange, getMyAppointments } from '../../api/appointments.js';
import { me } from '../../api/auth.js';
import dayjs from 'dayjs';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useDisclosure } from '@mantine/hooks';
import { cancelAppointment } from '../../api/appointments.js';
import { sendCancelEmail, sendConfirmationEmail, sendEditEmail } from '../../api/email.js';

const excludedDays = [5, 6]; // Exclude specific days (0 = Monday, ..., 6 = Sunday)

export default function ClientDashboard() {
    const [allTimeslots, setAllTimeslots] = useState([{}]);
    const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [processingBooking, setProcessingBooking] = useState(false);
    const [loadingTimeGrid, setLoadingTimeGrid] = useState(false);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [bookedTimes, setBookedTimes] = useState([]);
    const [myAppointment, setMyAppointment] = useState({});
    const [modalState, {open, close}] = useDisclosure(false);
    const [modalLoading, setModalLoading] = useState(false);

    const [myUsername, setMyUserName] = useState('');

    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();

    dayjs.extend(customParseFormat);


    if (!token) {
        navigate('/');
        return null;
    }

    const normalizeApptDate = (apptDate) => {
        if (!apptDate) return apptDate;
        if (typeof apptDate === 'string') return apptDate.includes('T') ? apptDate.slice(0, 10) : apptDate;
        if (apptDate instanceof Date) return apptDate.toISOString().slice(0, 10);
        const asString = String(apptDate);
        return asString.includes('T') ? asString.slice(0, 10) : asString;
    };

    const parseApptDate = (apptDate) => dayjs(normalizeApptDate(apptDate), 'YYYY-MM-DD', true);

    const handleBooking = async () => {
        if (myAppointment && myAppointment.appt_date) {
            notifications.show({
                title: 'Error',
                message: 'You already have an appointment booked, please cancel or edit your existing appointment before booking a new one.',
                color: 'red',
            });
            return;
        }

        if (selectedDate && selectedTime) {
            // TODO: Send booking information to the backend and handle the response
            setProcessingBooking(true);

            const data = { appt_date: selectedDate, start_time: selectedTime };
            const res = await bookAppointment(token, data);

            if (res && res.success) {
                notifications.show({
                    title: 'Success',
                    message: 'Appointment booked successfully',
                    color: 'var(--mantine-color-green-6)',
                    autoClose: 5000,
                    withCloseButton: true,
                    withBorder: true,
                    style: {
                        border: '3px solid',
                        borderColor: 'var(--mantine-color-green-6)',
                        borderRadius: '8px',
                    }
                });
                handleAvailableTimes(selectedDate); // Refresh available times after booking
                fetchMyAppointment();
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
        setSelectedTime(null);
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

    const handleCancelBooking = async (appointment) => {
        setModalLoading(true);
        const res = await cancelAppointment(token, normalizeApptDate(appointment.appt_date), appointment.start_time);
        if (res && res.success) {
            notifications.show({
                title: 'Success',
                message: 'Appointment cancelled successfully',
                color: 'var(--mantine-color-green-6)',
                autoClose: 5000,
                withCloseButton: true,                withBorder: true,
                style: {
                    border: '3px solid',
                    borderColor: 'var(--mantine-color-green-6)',
                    borderRadius: '8px',
                }
            });
        } else {
            notifications.show({
                title: 'Error',
                message: res?.error || 'Failed to cancel appointment',
                color: 'red',
            });
        }
        setModalLoading(false);
        close();
        handleAvailableTimes(selectedDate); // Refresh available times after cancellation
        fetchMyAppointment(); // Refresh user's appointment information after cancellation
    }

    const fetchMyAppointment = async () => {
        const myAppointment = await getMyAppointments(token);
        const earliestAppointment = myAppointment.filter(appointment => normalizeApptDate(appointment.appt_date) >= dayjs().format('YYYY-MM-DD'));
        setMyAppointment(earliestAppointment[0]);
    };

    useEffect(() => {
        
        fetchMyAppointment();

    }, []);

    useEffect(() => {
        const fetchTimeslots = async () => {
            const timeslots = await getAppointmentsInDateRange(token, dayjs(currentMonth).startOf('month').format('YYYY-MM-DD'), dayjs(currentMonth).endOf('month').format('YYYY-MM-DD'))
            setAllTimeslots(timeslots);
        };

        fetchTimeslots();
    }, [currentMonth, token]);

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
                    {myAppointment && myAppointment.appt_date ? `You have a booking for ${parseApptDate(myAppointment.appt_date).format('MMMM D, YYYY')} at ${dayjs(myAppointment.start_time, 'HH:mm:ss').format('h:mm A')}, ` : 'You do not have any upcoming bookings. '}
                    {myAppointment && myAppointment.appt_date && <a onClick={open} style={{cursor: 'pointer', textDecoration: 'underline'}}>click here to edit/cancel your booking.</a>}
                </div>
                <div className="box" style={{display: 'flex', justifyContent: 'center'}}>
                    
                    {/* TODO: Change this navigation because the user can just enter someone else's account with the username */}
                    <Button justify='center' size='lg' mt={20} onClick={() => navigate(`/clientDashboard/account/${myUsername}`)}>
                        View My Account
                        </Button>

                </div>
                <div className="box">
                    
                </div>
            </SimpleGrid>
            <Grid verticalspacing="xs" style={{ height: '60vh', marginTop: '20px', marginBottom: '20px', alignItems: 'stretch' }}>

                <Grid.Col span={6} style={{height: "500px"}}>
                    <div className="calendar">
                        <DatePicker
                            size="xl"
                            onChange={handleAvailableTimes}
                            onMonthSelect={setCurrentMonth}
                            onNextMonth={setCurrentMonth}
                            onPreviousMonth={setCurrentMonth}
                            firstDayOfWeek={0}
                            excludeDate={(date) =>{
                                if (excludedDays.includes(new Date(date).getDay())) {
                                    return true;
                                } else if (!allTimeslots.some(timeslot => normalizeApptDate(timeslot.appt_date) === dayjs(date).format('YYYY-MM-DD') && timeslot.username === null)) {
                                    return true;
                                // } else if (dayjs(date).format('YYYY-MM-DD') < dayjs().format('YYYY-MM-DD')) { // Disable past dates
                                //     return true;
                                } else {
                                    return false;
                                }
                            }}
                            hideOutsideDates
                        />
                    </div>
                </Grid.Col>

                <Grid.Col span={6} style={{height: "500px"}}>
                    <div className="time-grid">
                        <ScrollArea style={{ height: '100%'}}>
                            <LoadingOverlay visible={loadingTimeGrid} overlayProps={{ radius: "sm", blur: 2 }} />

                            <TimeGrid
                                data={availableTimes}
                                value={selectedTime}
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
                                style={{marginBottom: '20px', padding: '10px'}}
                            />

                            <div className="booking-button">
                                <Button size="lg" onClick={handleBooking} loading={processingBooking} disabled={!selectedDate || !selectedTime}>
                                    Book Appointment
                                </Button>
                            </div>
                        </ScrollArea>
                    </div>
                </Grid.Col>
            </Grid>
            <Modal opened={modalState} onClose={close} title="Booking Information" centered>
                <LoadingOverlay visible={modalLoading}/>
                <div className="modal-content">
                    <p><strong>Date:</strong> {myAppointment && myAppointment.appt_date ? parseApptDate(myAppointment.appt_date).format('MMMM D, YYYY') : 'N/A'}</p>
                    <p><strong>Time:</strong> {myAppointment && myAppointment.start_time ? dayjs(myAppointment.start_time, 'HH:mm').format('h:mm A') : 'N/A'}</p>
                    <p><strong>Notes:</strong> {myAppointment && myAppointment.appt_notes ? myAppointment.appt_notes : 'N/A'}</p>
                    <div>
                        <Button mr={10}>
                            Edit Booking
                        </Button>

                        <Button ml={10} onClick={() => handleCancelBooking(myAppointment)}>
                            Cancel Booking
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );

}
