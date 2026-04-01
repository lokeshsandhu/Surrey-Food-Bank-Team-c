import { Stack, TextInput, Group, Table, Button, Modal, Select, Title } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { createFamilyMember, deleteFamilyMember, getFamilyMembers, updateFamilyMember } from "../../api/familyMembers";
import '../styles/clientList.css';
import { DateInput } from "@mantine/dates";
import { IconUserPlus } from '@tabler/icons-react';
import { FMRelationshipOptions } from '../constants/FormOptions';
import { getMyAppointments } from "../../api/appointments";
import { useNavigate } from "react-router";

export default function AppointmentsTab({ clientUsername }) {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role')
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);

    if (!token) {
        navigate('/');
        return null;
    }

    const getAppointmentHistory = async () => {
        try {
            const appts = await getMyAppointments(token);
            setAppointments(appts);
        } catch (err) {
            console.log("Error loading appointments ", err);
        }
    };

    useEffect(() => {
        getAppointmentHistory();
    }, []);

    const rows = appointments.map((appt, index) => (
        <Table.Tr key={index}>
            <Table.Td>{index + 1}</Table.Td>
            <Table.Td>{appt.appt_date}</Table.Td>
            <Table.Td>{appt.start_time.slice(0, 5)}</Table.Td>
            <Table.Td>{appt.end_time.slice(0, 5)}</Table.Td>
            <Table.Td>{appt.appt_notes}</Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Group justify="space-between" mb={10}>
                <Title order={2}>Appointment History</Title>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Button
                        onClick={() => { 
                            if (role === 'admin') {
                                navigate('/adminDashboard'); 
                            } else {
                                navigate('/clientDashboard'); 
                            }
                        }}
                    >
                        Book Appointment in Dashboard
                    </Button>
                </div>
            </Group>
            <Table.ScrollContainer maxHeight={'80%'}>
                <Table
                    miw={500}
                    verticalSpacing="sm"
                    stickyHeader
                    withTableBorder
                    highlightOnHover
                    bgcolor='white'
                    w={'100%'}
                >
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>#</Table.Th>
                            <Table.Th>Date</Table.Th>
                            <Table.Th>Start Time</Table.Th>
                            <Table.Th>End Time</Table.Th>
                            <Table.Th>Appointment Notes</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </div>
    );
};