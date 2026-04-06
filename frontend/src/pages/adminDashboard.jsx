import { Button, SimpleGrid, LoadingOverlay, ScrollArea, Grid, Switch, Menu, Text } from '@mantine/core';
import { DatePicker, DatePickerInput, TimePicker, getTimeRange } from '@mantine/dates';
import { notifications } from '@mantine/notifications';

import '../styles/adminstyles.css';
import React, { useEffect } from 'react';
import { AdminNavBar } from '../components/navBar.jsx';
import { useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { getAppointmentsInDateRange, createAppointmentsInTimeRange, updateAppointment, getAppointmentsInDateTimeRange, cleanupPastAppointments } from '../../api/appointments.js';
import { mkConfig, generateCsv, download } from "export-to-csv";

import { useNavigate } from 'react-router';

const excludedDays = [5, 6]; // Exclude specific days (0 = Monday, ..., 6 = Sunday)

export default function AdminDashboard() {

    const token = sessionStorage.getItem('token');

    dayjs.extend(customParseFormat);

    //For time list
    const [loadingTimeList, setLoadingTimeList] = useState(false);
    const [bookedTimeslots, setBookedTimeslots] = useState([[], [], [], [], [], [], []]);
    const [showOnlyBooked, setShowOnlyBooked] = useState(false);
    const [currWeek, setCurrWeek] = useState(dayjs());

    // For creating timeslots
    const [createTimeslotDate, setCreateTimeslotDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [createTimeslotStart, setCreateTimeslotStart] = useState("08:00:00");
    const [createTimeslotEnd, setCreateTimeslotEnd] = useState("16:00:00");

    // For calendar
    const [hovered, setHovered] = useState(null);
    const [value, setValue] = useState(dayjs());

    // For making bookings
    const [createBookingDate, setCreateBookingDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [createBookingTime, setCreateBookingTime] = useState("08:00:00");

    // For export csv
    const [csvStartDate, setCsvStartDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [csvEndDate, setCsvEndDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [exportLoading, setExportLoading] = useState(false);

    const navigate = useNavigate();

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

    const normalizePickerDate = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return normalizeApptDate(value);
        return dayjs(value).format('YYYY-MM-DD');
    };

    const findBookingsForDate = async (date, onlyBooked = showOnlyBooked) => {
        setLoadingTimeList(true);
        setCurrWeek(dayjs(date));

        const timeslotsbyday = [[], [], [], [], [], [], []];
        const timeslots = await getAppointmentsInDateRange(token, dayjs(startOfWeek(date)).format('YYYY-MM-DD'), dayjs(endOfWeek(date)).format('YYYY-MM-DD'));

        console.log('Finding bookings for date between:', dayjs(startOfWeek(date)).format('YYYY-MM-DD'), 'and', dayjs(endOfWeek(date)).format('YYYY-MM-DD'));
        console.log('Received number of timeslots:', timeslots.length);

        for (let i = 0; i < 7; i++) {
            const dateToCheck = dayjs(startOfWeek(date)).add(i, 'day').format('YYYY-MM-DD');
            console.log('Checking date:', dateToCheck);

            const slotsForDate = timeslots.filter(slot => normalizeApptDate(slot.appt_date) === dateToCheck);
            console.log(`Found ${slotsForDate.length} slots for date ${dateToCheck}:`, slotsForDate);

            if (timeslots) {
                if (onlyBooked) {
                    timeslotsbyday[i] = slotsForDate.filter(slot => slot.username !== null);
                    console.log(`After filtering for booked slots, ${timeslotsbyday[i].length} slots remain for date ${dateToCheck}:`, timeslotsbyday[i]);
                } else {
                    timeslotsbyday[i] = slotsForDate;
                }
            } else {
                console.log('No timeslots received');
            }
        }

        setBookedTimeslots(timeslotsbyday);
        setLoadingTimeList(false);
    };

    const createTimeslot = async () => {

        const apptDate = normalizePickerDate(createTimeslotDate);
        console.log('Creating timeslot with date:', apptDate, 'start:', dayjs(createTimeslotStart, 'HH:mm:ss').format('HH:mm'), 'end:', dayjs(createTimeslotEnd, 'HH:mm:ss').format('HH:mm'));

        const res = await createAppointmentsInTimeRange(token, {
            appt_date: apptDate,
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
    };

    const makeBooking = async (bookingDate = createBookingDate, bookingTime = createBookingTime) => {

        const apptDate = normalizePickerDate(bookingDate);
        console.log('Creating booking with date:', apptDate, 'start:', dayjs(bookingTime, 'HH:mm:ss').format('HH:mm'));

        const times = await getAppointmentsInDateTimeRange(token, apptDate, dayjs(bookingTime, 'HH:mm:ss').format('HH:mm'), dayjs(bookingTime, 'HH:mm:ss').add(15, 'minutes').format('HH:mm'));
        console.log('Received timeslots for booking:', times);

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

        const res = await updateAppointment(token, apptDate, dayjs(bookingTime, 'HH:mm:ss').format('HH:mm'), { username: "admin" });
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
            // Reload the time list for the selected week
            if (value) {
                await findBookingsForDate(value);
            }
        }
    };

    // Get appointments within a time range to export to csv
    const handleApptRangeExport = async () => {
        try {
            setExportLoading(true);

            const appointments = await getAppointmentsInDateRange(token, dayjs(csvStartDate).format('YYYY-MM-DD'), dayjs(csvEndDate).format('YYYY-MM-DD'));

            let bookedAppointments = appointments.filter(d => d.booked_count > 0);

            bookedAppointments = bookedAppointments.map(d => {
                let clients = d.usernames.join(',');
                return {
                    ...d,
                    usernames: clients
                };
            });

            if (bookedAppointments.length > 0) {
                // setting export to csv configurations
                const csvConfig = mkConfig(
                    {
                        useKeysAsHeaders: true,
                        filename: `bookings_${csvStartDate}_to_${csvEndDate}`
                    });

                // Generate and download csv
                const csv = generateCsv(csvConfig)(bookedAppointments);
                download(csvConfig)(csv);
            } else {
                notifications.show({
                    title: 'No bookings in this date range',
                    message: 'Please try a different date range.',
                    color: 'red',
                });
            }

        } catch (err) {
            notifications.show({
                title: 'Error Exporting CSV',
                message: 'There was an error exporting the bookings to CSV. Please try again.',
                color: 'red',
            });
        } finally {
            setExportLoading(false);
        }

    };

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                const cleanupResult = await cleanupPastAppointments(token);
                if (cleanupResult?.success === false) {
                    notifications.show({
                        title: 'Error',
                        message: cleanupResult?.error || 'Failed to archive past appointments',
                        color: 'red'
                    });
                }
            } catch (error) {
                console.error('Error archiving past appointments:', error);
            }

            await findBookingsForDate(value);
        };

        initializeDashboard();
    }, []);

    return (
        <div className="page">
            <AdminNavBar />
            <SimpleGrid cols={3} spacing="xs" verticalspacing="xs" style={{ height: '100%' }}>
                <div className="box" style={{ height: '100%' }}>
                    <Text>
                        Welcome back {sessionStorage.getItem('username')}!
                    </Text>
                </div>
                <div className="box">
                    <Text>Use the Navigation bar above to access the following:</Text>
                    <hr></hr>
                    <Text><strong>Timeslots Page</strong></Text>
                    <ul>
                        <li>Create or edit available timeslots</li>
                        <li>View booked appointments</li>
                        <li>Create bookings for clients</li>
                    </ul>
                    <Text><strong>Client List</strong></Text>
                    <ul>
                        <li>View all clients</li>
                        <li>View or edit a client's account information</li>
                        <li>View a client's past appointment history</li>
                    </ul>
                    {/* <DatePickerInput
                        label="Pick date to make booking for client"
                        value={createBookingDate ? createBookingDate : dayjs()}
                        onChange={setCreateBookingDate}
                    />

                    <TimePicker label="Appointment timeslot start time" value={createBookingTime} onChange={setCreateBookingTime} format="12h" withDropdown presets={getTimeRange({ startTime: '08:00:00', endTime: '16:00:00', interval: '00:15:00' })} />
                    <Button onClick={() => makeBooking()} style={{ marginTop: '20px' }}>Make booking</Button> */}
                </div>
                <div className="box">
                    <Text style={{ textAlign: 'center' }} fw={600}>Export booked appointments</Text>
                    <Text style={{ textAlign: 'center' }}>Select a start and end date and click the button below to export all bookings within that time range.</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                            <DatePickerInput
                                label='Start Date'
                                placeholder='Pick a start date'
                                value={csvStartDate}
                                onChange={(date) => {
                                    setCsvStartDate(date);
                                    if (csvEndDate < date) {
                                        setCsvEndDate(date);
                                    }
                                }}
                            />
                            <DatePickerInput
                                label='End Date'
                                placeholder='Pick a end date'
                                value={csvEndDate}
                                onChange={setCsvEndDate}
                                minDate={csvStartDate}
                            />
                        </div>
                        <Button
                            onClick={handleApptRangeExport}
                            loading={exportLoading}
                        >
                            Export Bookings to CSV
                        </Button>
                    </div>

                    {/* <DatePickerInput
                        label="Pick date for new timeslots"
                        value={createTimeslotDate ? createTimeslotDate : dayjs()}
                        onChange={setCreateTimeslotDate}
                    />

                    <TimePicker label="From" value={createTimeslotStart} onChange={setCreateTimeslotStart} format="12h" withDropdown presets={getTimeRange({ startTime: '08:00:00', endTime: createTimeslotEnd, interval: '00:15:00' })} />
                    <TimePicker label="To" value={createTimeslotEnd} onChange={setCreateTimeslotEnd} format="12h" withDropdown presets={getTimeRange({ startTime: createTimeslotStart, endTime: '16:00:00', interval: '00:15:00' })} />
                    <Button onClick={createTimeslot} style={{ marginTop: '20px' }}>Create timeslots</Button> */}
                </div>
            </SimpleGrid>
            {/* <Grid verticalspacing="xs" style={{ height: '60vh', marginTop: '20px', marginBottom: '20px', alignItems: 'stretch' }}>
                <Grid.Col span={4} style={{ height: "500px" }}>
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
                </Grid.Col>

                <Grid.Col span={8} style={{ height: '500px' }}>
                    <div className="time-list">

                        <LoadingOverlay visible={loadingTimeList} overlayProps={{ radius: "sm", blur: 2 }} />

                        <Switch label="Show only booked timeslots" checked={showOnlyBooked} onChange={(event) => {
                            const next = event.currentTarget.checked;
                            setShowOnlyBooked(next);
                            findBookingsForDate(currWeek, next);
                        }} />

                        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                            {bookedTimeslots.map((day, i) => (
                                <div key={i} style={{ marginBottom: '20px' }}>
                                    {day.length > 0 && (
                                        <Text size="lg" weight={500} style={{ marginBottom: '10px' }}>
                                            {parseApptDate(day[0].appt_date).format('dddd, MMMM D, YYYY')}
                                        </Text>
                                    )}
                                    {day.map(slot => (
                                        slot.username ? (
                                            <Button key={`${slot.appt_date}-${slot.start_time}`} variant="filled" color="red" style={{ width: "100%", marginBottom: '10px' }}>
                                                {dayjs(slot.start_time, 'HH:mm:ss').format('h:mm A')} - Booked by {slot.username}
                                            </Button>
                                        ) : (
                                            <Menu key={`${slot.appt_date}-${slot.start_time}-menu`} shadow="md" width={200} withArrow>
                                                <Menu.Target>
                                                    <Button key={`${slot.appt_date}-${slot.start_time}`} variant="filled" style={{ width: "100%", marginBottom: '10px' }} color="green">
                                                        {normalizeApptDate(slot.appt_date)} {dayjs(slot.start_time, 'HH:mm:ss').format('h:mm A')} - {slot.username ? `Booked by ${slot.username}` : 'Available'}
                                                    </Button>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item key={`${slot.appt_date}-${slot.start_time}-create`} onClick={() => {
                                                        makeBooking(normalizeApptDate(slot.appt_date), dayjs(slot.start_time, 'HH:mm:ss').format('HH:mm:ss'));
                                                    }}>
                                                        Create Booking
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        )
                                    ))}
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                </Grid.Col>
            </Grid> */}
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
