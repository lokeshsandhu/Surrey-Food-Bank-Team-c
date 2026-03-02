import React, { useEffect } from 'react';
import '../styles/adminstyles.css';
import { AdminNavBar } from '../components/navBar';
import { WeekView } from '@mantine/schedule';
import dayjs from 'dayjs';
import { useState } from 'react';
import { getAppointmentsInDateRange } from '../../api/appointments.js';
import { useNavigate } from 'react-router';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LoadingOverlay } from '@mantine/core';

export default function TimeslotPage() {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [events, setEvents] = useState([]); // Placeholder for fetched timeslots
    const [loadingTimeslots, setLoadingTimeslots] = useState(false);

    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();

    dayjs.extend(customParseFormat);

    if (!token) {
        navigate('/');
        return null;
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
            start: `${dayjs(slot.appt_date).format('YYYY-MM-DD')} ${dayjs(slot.start_time, 'HH:mm:ss').format('HH:mm')}`,
            end: `${dayjs(slot.appt_date).format('YYYY-MM-DD')} ${dayjs(slot.end_time, 'HH:mm:ss').format('HH:mm')}`,
            color: slot.username ? 'red' : 'green',
        }));

        console.log('Formatted timeslots:', formattedTimeslots);
        setEvents(formattedTimeslots);
    } finally {
        setLoadingTimeslots(false);
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
                startTime={'08:00'}
                endTime={'16:00'}
                intervalMinutes={30}
                withWeekNumber={false}
                withAllDaySlots={false}
                slotLabelFormat="h:mm A"
                slotHeight={50}
                style={{
                    weekViewRoot: { width: '100%', height: '100%' },
                    weekViewHeader: {width: '100%', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' },
                    weekViewInner: { width: '100%', height: '100%' },
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '10px',
                    padding: '20px',
                    margin: '20px',
                    boxShadow: '0px 4px 4px 2px #0000006a',
                    height: '100%',
                    justifySelf: 'top',
                }}
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