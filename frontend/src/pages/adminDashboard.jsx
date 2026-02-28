import { Button, SimpleGrid, LoadingOverlay, ScrollArea, Stack, Text } from '@mantine/core';
import { DatePicker, DatePickerInput, TimePicker, getTimeRange } from '@mantine/dates';
import { notifications } from '@mantine/notifications';

import '../styles/adminstyles.css';
import React from 'react';
import { AdminNavBar } from '../components/navBar.jsx';
import { useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { getAppointmentsInDateRange, createAppointmentsInTimeRange, updateAppointment, getAppointmentsInDateTimeRange } from '../../api/appointments.js';

import { useNavigate } from 'react-router';

const excludedDays = [5, 6]; // Exclude specific days (0 = Monday, ..., 6 = Sunday)

export default function AdminDashboard() {

    const token = sessionStorage.getItem('token');

    dayjs.extend(customParseFormat);

    //For time list
    const [loadingTimeList, setLoadingTimeList] = useState(false);
    const [bookedTimeslots, setBookedTimeslots] = useState([]);

    // For creating timeslots
    const [createTimeslotDate, setCreateTimeslotDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [createTimeslotStart, setCreateTimeslotStart] = useState("08:00:00");
    const [createTimeslotEnd, setCreateTimeslotEnd] = useState("16:00:00");

    // For calendar
    const [hovered, setHovered] = useState(null);
    const [value, setValue] = useState(null);

    // For making bookings
    const [createBookingDate, setCreateBookingDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [createBookingTime, setCreateBookingTime] = useState("08:00:00");

    const navigate = useNavigate();

    if (!token) {
        navigate('/');
        return null;
    }

    const findBookingsForDate = async (date) => {
        setLoadingTimeList(true);

        console.log('Finding bookings for date between:', dayjs(startOfWeek(date)).format('YYYY-MM-DD'), 'and', dayjs(endOfWeek(date)).format('YYYY-MM-DD'));

        const timeslots = await getAppointmentsInDateRange(token, dayjs(startOfWeek(date)).format('YYYY-MM-DD'), dayjs(endOfWeek(date)).format('YYYY-MM-DD'));

        console.log(timeslots);

        if (timeslots) {
            console.log('Received number of timeslots in if:', timeslots.length);
            setBookedTimeslots(timeslots);
        } else {
            console.log('No timeslots received');
        }

        console.log('Received number of timeslots not if:', timeslots.length);

        setLoadingTimeList(false);
    };

    const createTimeslot = async () => {

        console.log('Creating timeslot with date:', dayjs(createTimeslotDate).format('YYYY-MM-DD'), 'start:', dayjs(createTimeslotStart, 'HH:mm:ss').format('HH:mm'), 'end:', dayjs(createTimeslotEnd, 'HH:mm:ss').format('HH:mm'));

        const res = await createAppointmentsInTimeRange(token, {
            appt_date: dayjs(createTimeslotDate).format('YYYY-MM-DD'),
            start_time: dayjs(createTimeslotStart, 'HH:mm:ss').format('HH:mm'),
            end_time: dayjs(createTimeslotEnd, 'HH:mm:ss').format('HH:mm'),
            appt_notes: ""
        });

        console.log('Create timeslot response:', res);

        if (res && res.success) {
            notifications.show({
                title: 'Success',
                message: 'Timeslot created successfully',
                color: 'green'
            });

        } else {
            notifications.show({
                title: 'Error',
                message: 'Failed to create timeslot: ' + (res?.error || ''),
                color: 'red'
            });
        }
    }

    const makeBooking = async () => {
        console.log('Creating booking with date:', dayjs(createBookingDate).format('YYYY-MM-DD'), 'start:', dayjs(createBookingTime, 'HH:mm:ss').format('HH:mm'));

        const times = await getAppointmentsInDateTimeRange(token, dayjs(createBookingDate).format('YYYY-MM-DD'), dayjs(createBookingTime, 'HH:mm:ss').format('HH:mm'), dayjs(createBookingTime, 'HH:mm:ss').add(15, 'minutes').format('HH:mm'));
        if (times.length === 0) {
            notifications.show({
                title: 'Error',
                message: 'No available timeslot found for the selected date and time.',
                color: 'red'
            });
            return;
        } else if (times[0].username !== null) {
            notifications.show({
                title: 'Error',
                message: 'The selected timeslot is already booked.',
                color: 'red'
            });
            return;
        }

        const res = await updateAppointment(token, dayjs(createBookingDate).format('YYYY-MM-DD'), dayjs(createBookingTime, 'HH:mm:ss').format('HH:mm'), { username: "admin" });
        console.log('Make booking response:', res);

        if (res.error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to create booking: ' + (res?.error || ''),
                color: 'red'
            });
        } else {
            notifications.show({
                title: 'Success',
                message: 'Booking created successfully',
                color: 'green'
            });
        }

    }

    return (
        <div className="page">
            <AdminNavBar />
            <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs" style={{ height: '100%' }}>
                <div className="box" style={{height: '100%'}}>
                    <Text>
                        Welcome back {sessionStorage.getItem('username')}! You have a booking for _____, click here to edit/cancel your booking.
                    </Text>
                    <Button justify='end' mt={20} onClick={() => navigate('/adminDashboard/clientList')}>View Client List</Button>
                </div>
                <div className="box">
                    <DatePickerInput
                        label="Pick date to make booking for client"
                        value={createBookingDate ? createBookingDate : dayjs()}
                        onChange={setCreateBookingDate}
                    />

                    <TimePicker label="Appointment timeslot start time" value={createBookingTime} onChange={setCreateBookingTime} format="12h" withDropdown presets={getTimeRange({ startTime: '08:00:00', endTime: '16:00:00', interval: '00:15:00' })} />
                    <Button onClick={makeBooking} style={{ marginTop: '20px' }}>Make booking</Button>
                </div>
                <div className="box">
                    <DatePickerInput
                        label="Pick date for new timeslots"
                        value={createTimeslotDate ? createTimeslotDate : dayjs()}
                        onChange={setCreateTimeslotDate}
                    />

                    <TimePicker label="From" value={createTimeslotStart} onChange={setCreateTimeslotStart} format="12h" withDropdown presets={getTimeRange({ startTime: '08:00:00', endTime: createTimeslotEnd, interval: '00:15:00' })} />
                    <TimePicker label="To" value={createTimeslotEnd} onChange={setCreateTimeslotEnd} format="12h" withDropdown presets={getTimeRange({ startTime: createTimeslotStart, endTime: '16:00:00', interval: '00:15:00' })} />
                    <Button onClick={createTimeslot} style={{ marginTop: '20px' }}>Create timeslots</Button>
                </div>
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs" style={{ height: '60vh', marginTop: '20px', marginBottom: '20px', alignItems: 'stretch' }}>
                <div className="calendar">
                    <DatePicker
                        size="xl"
                        onChange={findBookingsForDate}
                        firstDayOfWeek={0}
                        excludeDate={(date) => excludedDays.includes(new Date(date).getDay())}
                        getDayProps={(date) => {
                            const isHovered = isInWeekRange(date, hovered);
                            const isSelected = isInWeekRange(date, value);
                            const isInRange = isHovered || isSelected;
                            return {
                                onMouseEnter: () => setHovered(date),
                                onMouseLeave: () => setHovered(null),
                                inRange: isInRange,
                                firstInRange: isInRange && new Date(date).getDay() === 1,
                                lastInRange: isInRange && new Date(date).getDay() === 0,
                                selected: isSelected,
                                onClick: () => setValue(date),
                            };
                        }}
                    />
                </div>

                <div className="time-list">

                    <LoadingOverlay visible={loadingTimeList} overlayProps={{ radius: "sm", blur: 2 }} />

                    <ScrollArea.Autosize style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {bookedTimeslots.map(slot => (
                            <Button key={`${slot.appt_date}-${slot.start_time}`} variant="filled" style={{ width: "100%", marginBottom: '10px' }}>
                                {dayjs(slot.appt_date).format('YYYY-MM-DD')} {dayjs(slot.start_time, 'HH:mm:ss').format('h:mm A')} - {slot.username ? `Booked by ${slot.username}` : 'Available'}
                            </Button>
                        ))}
                    </ScrollArea.Autosize>
                </div>

            </SimpleGrid>
        </div>
    );
}

function getDay(date) {
    const day = dayjs(date).day();
    return day === 0 ? 6 : day - 1;
}

function startOfWeek(date) {
    return dayjs(date)
        .subtract(getDay(date) + 1, 'day')
        .toDate();
}

function endOfWeek(date) {
    return dayjs(date)
        .add(6 - getDay(date), 'day')
        .endOf('day')
        .toDate();
}

function isInWeekRange(date, value) {
    return value
        ? dayjs(date).isBefore(endOfWeek(value)) && dayjs(date).isAfter(startOfWeek(value))
        : false;
}