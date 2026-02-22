import { Button, SimpleGrid, LoadingOverlay, ScrollArea, Stack } from '@mantine/core';
import { DatePicker, } from '@mantine/dates';

import '../styles/styles.css';

import AdminNavbar from '../components/navBar';
import { useState } from 'react';
import { Notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { getAppointmentsInDateRange } from '../../../api/appointments.js';

import { useNavigate } from 'react-router';

const excludedDays = [1, 3, 5, 6]; // Exclude specific days (0 = Monday, ..., 6 = Sunday)

const token = sessionStorage.getItem('token');

export default function AdminDashboard() {

    // console.log('AdminDashboard token:', token);

    dayjs.extend(customParseFormat);

    const [loadingTimeGrid, setLoadingTimeGrid] = useState(false);
    const [bookedTimeslots, setBookedTimeslots] = useState([]);

    const [hovered, setHovered] = useState(null);
    const [value, setValue] = useState(null);

    const navigate = useNavigate();

    const findBookingsForDate = async (date) => {
        setLoadingTimeGrid(true);

        console.log('Finding bookings for date between:', dayjs(startOfWeek(date)).format('YYYY-MM-DD'), 'and', dayjs(endOfWeek(date)).format('YYYY-MM-DD'));

        const timeslots = await getAppointmentsInDateRange(token, dayjs(startOfWeek(date)).format('YYYY-MM-DD'), dayjs(endOfWeek(date)).format('YYYY-MM-DD'));

        console.log('Received number of timeslots:', timeslots.length);

        setBookedTimeslots(timeslots);

        setLoadingTimeGrid(false);
        
    };

    return (
        <div className="page">
            <AdminNavbar/>
            <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs" style={{ height: '100%'}}>
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
            <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs" style={{ height: '60vh', marginTop: '20px', marginBottom: '20px', alignItems: 'stretch'}}>

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

                    <LoadingOverlay visible={loadingTimeGrid} overlayProps={{ radius: "sm", blur: 2 }} />
                    
                    <ScrollArea.Autosize style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
                        {bookedTimeslots.map(slot => (
                            <Button key={`${slot.appt_date}-${slot.start_time}`} variant="filled" style={{width: "100%", marginBottom: '10px'}}>
                                {dayjs(slot.appt_date).format('YYYY-MM-DD')} {dayjs(slot.start_time, 'HH:mm:ss').format('h:mm A')} - {slot.username ? `Booked by ${slot.username}` : 'Available'}
                            </Button>
                        ))}
                    </ScrollArea.Autosize>
                </div>

            </SimpleGrid>
            <Button style={{margin: '20px'}} size="lg" onClick={() => {
                sessionStorage.removeItem('token');
                navigate('/');
            }}>
                Logout
            </Button>
            <Notifications/>
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