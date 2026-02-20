import { Button, SimpleGrid, LoadingOverlay, Notification, Stack } from '@mantine/core';
import { getTimeRange, DatePicker, TimeGrid } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';

import '../styles/styles.css';

import AdminNavbar from '../components/navBar';
import { useState } from 'react';
import { Notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

const excludedDays = [1, 3, 5, 6]; // Exclude specific days (0 = Monday, ..., 6 = Sunday)

// const { token } = useAuth();

export default function AdminDashboard() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [processingBooking, setProcessingBooking] = useState(false);
    const [loadingTimeGrid, setLoadingTimeGrid] = useState(false);
    const [bookedTimes, setBookedTimes] = useState([]);

    const [hovered, setHovered] = useState(null);
    const [value, setValue] = useState(null);

    const findBookingsForDate = (date) => {
        // Simulate fetching booked times for the selected date
        // getAppointmentsInDateRange(token, startOfWeek(date), endOfWeek(date))
        setLoadingTimeGrid(true);

        setTimeout(() => {
            // Simulate booked times (replace with actual API response)
            const simulatedBookedTimes = [
                dayjs(startOfWeek(date)).add(1, 'day').hour(10).minute(0).toDate(),
                dayjs(startOfWeek(date)).add(3, 'day').hour(14).minute(0).toDate(),
                dayjs(startOfWeek(date)).add(5, 'day').hour(16).minute(0).toDate(),
            ];
            setBookedTimes(simulatedBookedTimes);
            setLoadingTimeGrid(false);
        }, 1000);
    };

    return (
        <div className="page">
            <AdminNavbar/>
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
                    <Stack spacing="xs">
                        {bookedTimes.map(date => (
                            <Button key={date} variant="filled">
                                {dayjs(date).format('MM/DD HH:mm')}
                            </Button>
                        ))}
                    </Stack>
                </div>

            </SimpleGrid>
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