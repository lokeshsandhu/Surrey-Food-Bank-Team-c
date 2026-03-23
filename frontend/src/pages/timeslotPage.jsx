import React, { useEffect } from 'react';
import '../styles/adminstyles.css';
import { AdminNavBar } from '../components/navBar';
import { WeekView } from '@mantine/schedule';
import dayjs from 'dayjs';
import { useState } from 'react';
import { getAppointmentsInDateRange, createAppointmentsInTimeRange, updateAppointment } from '../../api/appointments.js';
import { useNavigate } from 'react-router';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { BookingForm } from '../components/bookingForm';
import { TimeslotForm } from '../components/timeslotForm.jsx';

export default function TimeslotPage() {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [events, setEvents] = useState([]); // Placeholder for fetched timeslots
    const [loadingTimeslots, setLoadingTimeslots] = useState(false);
    const [bookingModalOpened, bookingModalHandlers] = useDisclosure(false);
    const [timeslotModalOpened, timeslotModalHandlers] = useDisclosure(false);
    const [selectedBookingData, setSelectedBookingData] = useState(null);
    const [selectedTimeslotData, setSelectedTimeslotData] = useState(null);

    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();

    dayjs.extend(customParseFormat);

    const normalizeApptDate = (apptDate) => {
        if (!apptDate) return apptDate;
        if (typeof apptDate === 'string') return apptDate.includes('T') ? apptDate.slice(0, 10) : apptDate;
        if (apptDate instanceof Date) return apptDate.toISOString().slice(0, 10);
        const asString = String(apptDate);
        return asString.includes('T') ? asString.slice(0, 10) : asString;
    };

    const parseApptDate = (apptDate) => dayjs(normalizeApptDate(apptDate), 'YYYY-MM-DD', true);

    if (!token) {
        navigate('/');
        return null;
    }

    const handleTimeslotClick = (slotStart, slotEnd) => {
        setSelectedTimeslotData({start: slotStart, end: slotEnd});
        timeslotModalHandlers.open();
    }

    const handleSlotDragEnd = (rangeStart, rangeEnd) => {
        setSelectedTimeslotData({start: rangeStart, end: rangeEnd});
        timeslotModalHandlers.open();
    }

    const handleEventClick = (event) => {
        setSelectedBookingData(event);
        bookingModalHandlers.open();
    }

    const handleDeleteBooking = async (values) => {
        const bookingDate = dayjs(values.start).format('YYYY-MM-DD');
        const bookingTime = dayjs(values.start, 'YYYY-MM-DD HH:mm').format('HH:mm');
        
        const res = await updateAppointment(token, bookingDate, bookingTime, { username: null, appt_notes: null });

        if (res.error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete booking: ' + (res?.error || ''),
                color: 'red'
            });
        } else {
            notifications.show({
                title: 'Success',
                message: 'Booking successfully deleted',
                color: 'green'
            });

            await fetchTimeslots();
        }
    }

    useEffect(() => {
        fetchTimeslots();
    }, [token, date]);

    async function fetchTimeslots() {
        setLoadingTimeslots(true);
        try {
            const timeslots = await getAppointmentsInDateRange(
                token,
                dayjs(startOfWeek(date)).format('YYYY-MM-DD'),
                dayjs(endOfWeek(date)).format('YYYY-MM-DD')
            );
            console.log('Fetched timeslots:', timeslots);

            // Sort by date then start time before merging
            const sortedSlots = [...timeslots].sort((a, b) => {
                const aKey = `${a.appt_date} ${dayjs(a.start_time, 'HH:mm:ss').format('HH:mm:ss')}`;
                const bKey = `${b.appt_date} ${dayjs(b.start_time, 'HH:mm:ss').format('HH:mm:ss')}`;
                return aKey.localeCompare(bKey);
            });

            // Merge consecutive slots on same day with same (non-empty) username
            const mergedSlots = [];
            for (const slot of sortedSlots) {
                const last = mergedSlots[mergedSlots.length - 1];

                const sameDay = last && last.appt_date === slot.appt_date;
                const sameUser = last && last.username && slot.username && last.username === slot.username;
                const isConsecutive =
                    last &&
                    dayjs(last.end_time, 'HH:mm:ss').format('HH:mm:ss') ===
                        dayjs(slot.start_time, 'HH:mm:ss').format('HH:mm:ss');

                if (sameDay && sameUser && isConsecutive) {
                    last.end_time = slot.end_time; // extend previous slot
                } else {
                    mergedSlots.push({ ...slot });
                }
            }

            const formattedTimeslots = mergedSlots.map((slot) => ({
                id: `${slot.appt_date}-${slot.start_time}-${slot.end_time}-${slot.username || 'available'}`,
                title: slot.username || 'Available Slot',
                start: `${parseApptDate(slot.appt_date).format('YYYY-MM-DD')} ${dayjs(slot.start_time, 'HH:mm:ss').format('HH:mm')}`,
                end: `${parseApptDate(slot.appt_date).format('YYYY-MM-DD')} ${dayjs(slot.end_time, 'HH:mm:ss').format('HH:mm')}`,
                color: slot.username ? 'red' : 'green',
                appt_notes: slot.appt_notes,
            }));

            console.log('Formatted timeslots:', formattedTimeslots);
            setEvents(formattedTimeslots);
        } finally {
            setLoadingTimeslots(false);
        }
    }

    const handleBookingFormSubmit = async (values) => {
        const bookingDate = dayjs(values.start).format('YYYY-MM-DD');
        const bookingTime = dayjs(values.start, 'YYYY-MM-DD HH:mm').format('HH:mm');
        const username = values.title === 'Available Slot' ? null : values.title;
        const notes = values.appt_notes || '';

        console.log('Creating booking with date:', bookingDate, 'start:', bookingTime, 'end:', dayjs(bookingTime, 'HH:mm').add(15, 'minutes').format('HH:mm'), 'username:', username, 'notes:', notes);
        const res = await updateAppointment(token, bookingDate, bookingTime, { username: username, appt_notes: notes });
        console.log('Make booking response:', res);

        if (res.error == 'insert or update on table "appointment" violates foreign key constraint "appointment_fkey_user"') {
            notifications.show({
                title: 'Error',
                message: 'Failed to edit booking: user does not exist',
                color: 'red'
            });
        } else if (res.error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to edit booking: ' + (res?.error || ''),
                color: 'red'
            });
        } else {
            notifications.show({
                title: 'Success',
                message: 'Booking successfully edited',
                color: 'green'
            });
            // Reload timeslots to reflect new booking
            if (values) {
                await fetchTimeslots();
            }
        }
    }

    const handleTimeslotFormSubmit = async (values) => {
        const results = await Promise.all(
            values.dates.map(async (date) => {
                const data = {
                    appt_date: dayjs(date).format('YYYY-MM-DD'),
                    start_time: dayjs(values.start).format('HH:mm'),
                    end_time: dayjs(values.end).format('HH:mm'),
                    appt_notes: values.appt_notes,
                };

                const res = await createAppointmentsInTimeRange(token, data);
                return { date, error: res?.error || null };
            })
        );

        const errors = results.filter((result) => result.error);

        await fetchTimeslots();

        if (errors.length === 0) {
            notifications.show({
                title: 'Success',
                message: 'Timeslots successfully created',
                color: 'green'
            });
        } else if (errors.length < values.dates.length) {
            notifications.show({
                title: 'Partial Success',
                message: `Some timeslots were created successfully, but there were errors for the following dates: ${errors.map(e => dayjs(e.date).format('YYYY-MM-DD') + ' (' + e.error + ')').join(', ')}`,
                color: 'yellow'
            });
        } else {
            notifications.show({
                title: 'Error',
                message: 'Failed to create timeslots: ' + errors.map(e => dayjs(e.date).format('YYYY-MM-DD') + ' (' + e.error + ')').join(', '),
                color: 'red'
            });
        }
    }


    return (
        <div className="page">
            <AdminNavBar/>
                <LoadingOverlay visible={loadingTimeslots}/>
                <WeekView
                date={date}
                onDateChange={setDate}
                events={events}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeslotClick}
                withDragSlotSelect
                onSlotDragEnd={handleSlotDragEnd}
                startTime={'08:00'}
                endTime={'16:00'}
                intervalMinutes={15}
                withWeekNumber={false}
                withAllDaySlots={false}
                slotLabelFormat="h:mm A"
                slotHeight={50}
                styles={{
                    viewSelect: {visibility: 'hidden'},
                    weekViewDaySlots: {backgroundColor: '#f2f2f2'},
                }}
                withWeekendDays={false}
                style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '10px',
                    padding: '20px',
                    margin: '20px',
                    boxShadow: '0px 4px 4px 2px #0000006a',
                    height: '100%',
                    justifySelf: 'top',
                }}
                />
                <TimeslotForm opened={timeslotModalOpened} onClose={timeslotModalHandlers.close} values={selectedTimeslotData} onSubmit={handleTimeslotFormSubmit}/>
                <BookingForm opened={bookingModalOpened} onClose={bookingModalHandlers.close} onDelete={handleDeleteBooking} values={selectedBookingData} onSubmit={handleBookingFormSubmit}/>
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
