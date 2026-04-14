import { Group, Table, Button, Title } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { getMyAppointments, getUsernameAppointments } from "../../api/appointments";
import { useNavigate } from "react-router";

export default function AppointmentsTab({ clientUsername }) {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);

    if (!token) {
        navigate('/');
        return null;
    }

    // helper function written with the assistance of ChatGPT
    const mergeAppointments = (userApts) => {
        // Group by date
        const grouped = {};

        userApts.forEach((appt) => {
            if (!grouped[appt.appt_date]) {
                grouped[appt.appt_date] = [];
            }
            grouped[appt.appt_date].push(appt);
        });

        const merged = [];

        Object.values(grouped).forEach((dayAppts) => {
            // Sort by start time
            dayAppts.sort((a, b) => a.start_time.localeCompare(b.start_time));

            let current = { ...dayAppts[0] };

            for (let i = 1; i < dayAppts.length; i++) {
                const next = dayAppts[i];

                // If slots are adjacent → merge
                if (current.end_time === next.start_time) {
                    current.end_time = next.end_time;
                } else {
                    merged.push(current);
                    current = { ...next };
                }
            }

            merged.push(current);
        });

        return merged;
    };

    const getAppointmentHistory = async () => {
        try {
            let appts = [];
            if (role === 'admin') {
                appts = await getUsernameAppointments(token, clientUsername);
            } else {
                appts = await getMyAppointments(token);
            }
            const mergedApts = mergeAppointments(appts);
            setAppointments(mergedApts);
        } catch (err) {
        }
    };

    useEffect(() => {
        getAppointmentHistory();
    }, []);

    const cellStyle = {
        wordBreak: 'break-word',
        whiteSpace: 'normal',
    }

    const indexStyle = { maxWidth: 20}

    const rows = appointments.map((appt, index) => (
        <Table.Tr key={index}>
            <Table.Td style={{... cellStyle, ...indexStyle}}>{index + 1}</Table.Td>
            <Table.Td style={{ ...cellStyle}}>{appt.appt_date}</Table.Td>
            <Table.Td style={{ ...cellStyle}}>{appt.start_time?.slice(0, 5) ?? '-'}</Table.Td>
            <Table.Td style={{ ...cellStyle}}>{appt.end_time?.slice(0, 5) ?? '-'}</Table.Td>
            <Table.Td style={{ ...cellStyle}}>{appt.booking_status}</Table.Td>
            <Table.Td style={{ ...cellStyle}}>{appt.booking_notes ?? '-'}</Table.Td>
        </Table.Tr>
    ));

    return (
        <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Group justify="space-between" mb={10}>
                <Title order={2}>Appointment History</Title>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Button
                        onClick={() => {
                            if (role === 'admin') {
                                navigate('/adminDashboard/timeSlots');
                            } else {
                                navigate('/clientDashboard');
                            }
                        }}
                    >
                        Book Appointment in {role === 'admin' ? 'Timeslots Page' : 'Dashboard'}
                    </Button>
                </div>
            </Group>

            <Table.ScrollContainer
                style={{
                    flex: 1,
                    overflowY: 'auto',
                }}>
                <Table
                    verticalSpacing="sm"
                    stickyHeader
                    withTableBorder
                    highlightOnHover
                    bgcolor='white'
                    style={{ tableLayout: "fixed" }}
                    w={'100%'}
                >
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{...indexStyle}}>#</Table.Th>
                            <Table.Th>Date</Table.Th>
                            <Table.Th>Start Time</Table.Th>
                            <Table.Th>End Time</Table.Th>
                            <Table.Th>Booking Status</Table.Th>
                            <Table.Th>Booking Notes</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </div>
    );
};