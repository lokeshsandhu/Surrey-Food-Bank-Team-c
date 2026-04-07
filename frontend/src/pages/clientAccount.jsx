import React from "react";
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router';

import '../styles/adminstyles.css';
import '../styles/clientList.css';
import AccountInformationTab from "../components/AccountInformationTab";
import { AdminNavBar, ClientNavBar } from "../components/navBar";

import { ActionIcon, Tabs } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import FamilyMembersTab from "../components/FamilyMembersTab";
import AppointmentsTab from "../components/AppointmentsTab";

export function ClientAccount() {
    const params = useParams();
    const navigate = useNavigate();
    const client_username = params.username;

    const token = sessionStorage.getItem('token');

    if (!token) {
        navigate('/');
        return null;
    }

    return (
        <>
            <Tabs
                variant="pills"
                defaultValue="account"
                orientation="vertical"
                p={10}
                h={'95%'}

            >
                <Tabs.List bg='white' p={10} style={{ borderRadius: 4 }} h={'100%'}>
                    <Tabs.Tab value="account">Account Information</Tabs.Tab>
                    <Tabs.Tab value="family">Family Members</Tabs.Tab>
                    <Tabs.Tab value="appointments">Appointment History</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel
                    value="account"
                    pl={20}
                    pb={10}
                    style={{ overflowY: 'auto' }}
                >
                    <AccountInformationTab clientUsername={client_username} />
                </Tabs.Panel>
                <Tabs.Panel
                    value="family"
                    pl={20}
                    pb={10}
                >
                    <FamilyMembersTab clientUsername={client_username} />
                </Tabs.Panel>
                <Tabs.Panel
                    value="appointments"
                    pl={20}
                >
                    <AppointmentsTab clientUsername={client_username} />
                </Tabs.Panel>
            </Tabs>
        </>
    );
}

export function ClientAccountAdminView() {
    const navigate = useNavigate();
    return (
        <div className="page">
            <AdminNavBar />
            <div className="box" style={{ height: '85vh', margin: '20px' }}>
                <ActionIcon mb={10} onClick={() => navigate('/adminDashboard/clientList')}>
                    <IconArrowLeft />
                </ActionIcon>
                <ClientAccount />
            </div>
        </div>
    );
}

export function ClientAccountClientView() {
    const navigate = useNavigate();
    return (
        <div className="page" style={{ overflowY: 'auto' }}>
            <ClientNavBar />
            <div className="box" style={{ height: '85vh', margin: '20px'  }}>
                <ActionIcon mb={10} onClick={() => navigate('/clientDashboard')}>
                    <IconArrowLeft />
                </ActionIcon>
                <ClientAccount />
            </div>
        </div>
    );
}