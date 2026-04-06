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

    // For export csv
    const [csvStartDate, setCsvStartDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [csvEndDate, setCsvEndDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [exportLoading, setExportLoading] = useState(false);

    const navigate = useNavigate();

    if (!token) {
        navigate('/');
        return null;
    }

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

                </div>
            </SimpleGrid>
        </div>
    );
}
