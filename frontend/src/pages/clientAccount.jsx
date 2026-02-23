import React from "react"
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router';

import '../styles/adminstyles.css';
import '../styles/clientList.css';
import AccountInformationTab from "../components/AccountInformationTab";
import { AdminNavBar, ClientNavBar } from "../components/navBar";

import { ActionIcon, CloseButton, TextInput, Title, Table, Button, Tabs } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import FamilyMembersTab from "../components/FamilyMembersTab";

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
                p={20}
                h={'90%'}
            >
                <Tabs.List bg='white'>
                    <Tabs.Tab value="account">Account Information</Tabs.Tab>
                    <Tabs.Tab value="family">Family Members</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel
                    value="account"
                    pl={20}
                >
                    <AccountInformationTab clientUsername={client_username} />
                </Tabs.Panel>
                <Tabs.Panel
                    value="family"
                    pl={20}
                >
                    <FamilyMembersTab />
                </Tabs.Panel>
            </Tabs>
        </>
    )
}

export function ClientAccountAdminView() {
    const navigate = useNavigate();
    return (
        <div className="page">
            <AdminNavBar />
            <div className="box" style={{ height: '85vh' }}>
                <ActionIcon mb={10} onClick={() => navigate('/adminDashboard/clientList')}>
                    <IconArrowLeft />
                </ActionIcon>
                <ClientAccount />
            </div>
        </div>
    )
}

export function ClientAccountClientView() {
    const navigate = useNavigate();
    return (
        <div className="page">
            <ClientNavBar />
            <div className="box" style={{ height: '85vh' }}>
                <ActionIcon mb={10} onClick={() => navigate('/clientDashboard')}>
                    <IconArrowLeft />
                </ActionIcon>
                <ClientAccount />
            </div>
        </div>
    )
}