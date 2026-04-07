import React, { useEffect } from 'react';
import '../styles/adminstyles.css';
import { AdminNavBar } from '../components/navBar';
import { WeekView } from '@mantine/schedule';
import dayjs from 'dayjs';
import { useState } from 'react';
import { getAppointmentsInDateRange, createAppointmentsInTimeRange, updateAppointment, deleteAppointment, deleteAppointmentFromUsername } from '../../api/appointments.js';
import { useNavigate } from 'react-router';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { BookingForm } from '../components/bookingForm';
import { TimeslotForm } from '../components/timeslotForm.jsx';

export default function TimeslotPage() {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    const [events, setEvents] = useState([]);
    const [loadingTimeslots, setLoadingTimeslots] = useState(false);
    const [removingBookingUsername, setRemovingBookingUsername] = useState(null);
    const [bookingModalOpened, bookingModalHandlers] = useDisclosure(false);
    const [timeslotModalOpened, timeslotModalHandlers] = useDisclosure(false);
    const [selectedBookingData, setSelectedBookingData] = useState(null);
    const [selectedTimeslotData, setSelectedTimeslotData] = useState(null);

    const token = sessionStorage.getItem('token');
    const currentUsername = sessionStorage.getItem('username');
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

    const handleTimeslotClick = (data) => {
        const slotStart = data.slotStart;
        const slotEnd = data.slotEnd;
        if (!events.find((event) => dayjs(event.start).isSame(dayjs(slotStart)))) {
            setSelectedTimeslotData({start: slotStart, end: slotEnd});
            timeslotModalHandlers.open();
        }
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

    const handleDeleteTimeslot = async (values) => {
        const bookingDate = dayjs(values.start).format('YYYY-MM-DD');
        const bookingTime = dayjs(values.start, 'YYYY-MM-DD HH:mm').format('HH:mm');
        
        const res = await deleteAppointment(token, bookingDate, bookingTime);

        if (res.error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete timeslot: ' + (res?.error || ''),
                color: 'red'
            });
        } else {
            notifications.show({
                title: 'Success',
                message: 'Timeslot successfully deleted',
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

            // Sort by date then start time before merging
            const sortedSlots = [...timeslots].sort((a, b) => {
                const aKey = `${a.appt_date} ${dayjs(a.start_time, 'HH:mm:ss').format('HH:mm:ss')}`;
                const bKey = `${b.appt_date} ${dayjs(b.start_time, 'HH:mm:ss').format('HH:mm:ss')}`;
                return aKey.localeCompare(bKey);
            });

            const formattedTimeslots = sortedSlots.map((slot) => {
                const bookedUsers = Array.isArray(slot.usernames) ? slot.usernames : [];
                const preferredBookingUsername =
                    bookedUsers.includes(currentUsername)
                        ? currentUsername
                        : (bookedUsers[0] || null);

                return ({
                id: `${slot.appt_date}-${slot.start_time}-${slot.end_time}-${slot.username || 'available'}`,
                title: preferredBookingUsername || 'Available Slots',
                displayTitle: bookedUsers.length > 0
                    ? bookedUsers.join(', ')
                    : 'Available Slots',
                bookingUsername: preferredBookingUsername,
                bookedUsers,
                capacityLabel: `${slot.remaining_capacity ?? (slot.capacity ?? 1)}/${slot.capacity ?? 1}`,
                start: `${parseApptDate(slot.appt_date).format('YYYY-MM-DD')} ${dayjs(slot.start_time, 'HH:mm:ss').format('HH:mm')}`,
                end: `${parseApptDate(slot.appt_date).format('YYYY-MM-DD')} ${dayjs(slot.end_time, 'HH:mm:ss').format('HH:mm')}`,
                color:
                    Number(slot.booked_count || 0) === 0
                        ? 'green'
                        : Number(slot.remaining_capacity || 0) > 0
                            ? 'yellow'
                            : 'red',
                appt_notes: slot.appt_notes,
                capacity: slot.capacity,
                mincapacity: slot.capacity - slot.remaining_capacity,
            });
            });

            setEvents(formattedTimeslots);
            return formattedTimeslots;
        } finally {
            setLoadingTimeslots(false);
        }
    }

    const handleBookingFormSubmit = async (values) => {
        const bookingDate = dayjs(values.start).format('YYYY-MM-DD');
        const bookingTime = dayjs(values.start, 'YYYY-MM-DD HH:mm').format('HH:mm');
        const normalizedTitle = String(values.title || '').trim().replace(/\s+\d+\/\d+$/, '');
        const titleIndicatesAvailable = /^available slot(s)?$/i.test(normalizedTitle);
        const username = titleIndicatesAvailable ? null : (values.username ?? (normalizedTitle || null));
        const notes = values.appt_notes || '';
        const capacity = values.capacity || 1;

        let res;
        if (username === '') {
            res = await updateAppointment(token, bookingDate, bookingTime, { appt_notes: notes, capacity: capacity });
        } else {
            res = await updateAppointment(token, bookingDate, bookingTime, { username: username, appt_notes: notes, capacity: capacity });
        }

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
                    capacity: values.capacity,
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
    
    const handleRemoveBookedUser = async (usernameToRemove) => {
        if (!usernameToRemove) {
            return;
        }

        setRemovingBookingUsername(usernameToRemove);
        try {
            const res = await deleteAppointmentFromUsername(token, usernameToRemove);
            if (res?.error) {
                notifications.show({
                    title: 'Error',
                    message: res.error || 'Failed to remove booking',
                    color: 'red',
                });
                return;
            }

            notifications.show({
                title: 'Success',
                message: `Removed all bookings for ${usernameToRemove}`,
                color: 'green',
            });

            const refreshedEvents = await fetchTimeslots();
            const refreshed = refreshedEvents?.find((event) => event.start === selectedBookingData.start);
            if (refreshed) {
                setSelectedBookingData(refreshed);
            } else {
                bookingModalHandlers.close();
            }
        } finally {
            setRemovingBookingUsername(null);
        }
    }


    return (
        <div className="page">
            <AdminNavBar/>
            <LoadingOverlay visible={loadingTimeslots}/>
            <WeekView
                date={date}
                onDateChange={(newDate) => { if (dayjs(newDate).day() === 1 && dayjs(newDate).isSame(dayjs(date), 'day') === false) setDate(newDate); }}
                events={events}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeslotClick}
                withDragSlotSelect
                onSlotDragEnd={handleSlotDragEnd}
                renderEventBody={(event) => (
                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: '100%',
                            justifyContent: 'space-between',
                            pointerEvents: 'auto'
                        }}
                    >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.displayTitle || event.title}</span>
                        <span style={{ marginLeft: 'auto', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{event.capacityLabel}</span>
                    </div>
                )}
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
                    justifySelf: 'top',
                }}
            />
            <TimeslotForm opened={timeslotModalOpened} onClose={timeslotModalHandlers.close} values={selectedTimeslotData} onSubmit={handleTimeslotFormSubmit}/>
            
            <BookingForm
                opened={bookingModalOpened}
                onClose={bookingModalHandlers.close}
                onDeleteBooking={handleDeleteBooking} 
                onDeleteTimeslot={handleDeleteTimeslot} 
                values={selectedBookingData}
                bookedUsers={selectedBookingData?.bookedUsers || []}
                removingBookingUsername={removingBookingUsername}
                onRemoveBookedUser={handleRemoveBookedUser}
                onSubmit={handleBookingFormSubmit}
            />
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
