import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router';
import { AdminNavBar } from '../components/navBar';

import '../styles/adminstyles.css';

import { ActionIcon, CloseButton, TextInput, Title, Table, Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { getOwnerFamilyMembers } from '../../api/familyMembers';
import { getAccount } from '../../api/accounts';
import { splitAddress } from '../utils/displayHelpers';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

import { mkConfig, generateCsv, download } from 'export-to-csv';
import { CHARLIMITS } from '../constants/Validation';

import { capitalize } from '../utils/displayHelpers';

export default function ClientList() {
    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();

    if (!token) {
        navigate('/');
        return null;
    }

    const [searchText, setSearchText] = useState('');
    const [accountOwners, setAccountOwners] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);

    const getAccountDetails = async (resultOwners) => {
        let accountOwnerDetails = [];

        if (resultOwners && Array.isArray(resultOwners) && resultOwners.length > 0) {
            const accountDetails = await Promise.all(
                resultOwners.map(async (owner) => {
                    try {
                        const details = await getAccount(token, owner.username);
                        if (!details || details.error) {
                            return null;
                        }

                        const address = splitAddress(details.addr ?? '');

                        return {
                            username: owner.username,
                            f_name: owner.f_name,
                            l_name: owner.l_name,
                            email: owner.email,
                            phone: owner.phone,
                            address_line1: address.line1,
                            address_line2: address.line2,
                            address_city: address.city,
                            address_postal_code: address.postal_code,
                            household_size: details.household_size,
                            account_notes: details.account_notes,
                        };
                    } catch (error) {
                        console.error(`Failed to load account details for ${owner.username}`, error);
                        return null;
                    }
                })
            );

            accountOwnerDetails = accountDetails
                .filter(Boolean)
                .filter((d) => d.username !== 'admin');
        }

        setAccountOwners(accountOwnerDetails);
        return accountOwnerDetails;
    };

    const getAllAccountOwners = async () => {
        const resultOwners = await getOwnerFamilyMembers(token);
        return getAccountDetails(resultOwners);
    };

    const searchClients = async (input) => {
        let searchQuery = '';
        if (input && input.trim().length > 0) {
            searchQuery = input;
        } else {
            searchQuery = searchText;
        }
        const lowercaseSearchText = searchQuery.toLowerCase();

        const filtered = accountOwners.filter((d) =>
            d.f_name.toLowerCase().includes(lowercaseSearchText)
            || d.l_name.toLowerCase().includes(lowercaseSearchText)
            || d.username.toLowerCase().includes(lowercaseSearchText)
        );

        setAccountOwners(filtered);
    };

    const resetSearch = async () => {
        await getAllAccountOwners();
        setSearchText('');
    };

    const handleExportData = async () => {
        setSearchText('');
        try {
            setExportLoading(true);
            const latestOwners = await getAllAccountOwners();

            if (latestOwners.length > 0) {
                const csvConfig = mkConfig({
                    useKeysAsHeaders: true,
                    filename: `client_list_Export${dayjs().format('YYYY-MM-DD')}`,
                });

                const csv = generateCsv(csvConfig)(latestOwners);
                download(csvConfig)(csv);
            } else {
                notifications.show({
                    title: 'There are no client accounts',
                    message: 'Please try again when there is at least one client account.',
                    color: 'red',
                });
            }
        } catch (err) {
            notifications.show({
                title: 'Error Exporting CSV',
                message: 'There was an error exporting the clients to CSV. Please try again.',
                color: 'red',
            });
        } finally {
            setExportLoading(false);
        }
    };

    const colStyles = {
        name: { width: '10%' },
        username: { width: '10%' },
        email: { width: '18%' },
        phone: { width: '17%' },
        address: { width: '18%' },
        city: { width: '8%' },
        postal: { width: '8%' },
        household: { width: '3%' },
        notes: { width: '5%' },
        action: { width: '3%' },
    };

    const cellBase = {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
    };

    useEffect(() => {
        getAllAccountOwners();
    }, []);

    const clientRows = accountOwners.map((owner) => (
        <Table.Tr key={owner.username}>
            <Table.Td style={{ ...cellBase, ...colStyles.name }}>{capitalize(owner.l_name)}</Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.name }}>{capitalize(owner.f_name)}</Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.username }}>{owner.username}</Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.email }}>
                <a href={`mailto:${owner.email}`}>{owner.email}</a>
            </Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.phone }}>{owner.phone}</Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.address }}>
                {capitalize(owner.address_line1)}
                {owner.address_line2 && owner.address_line2.length > 0 ? `, ${owner.address_line2}` : null}
            </Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.city }}>{capitalize(owner.address_city)}</Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.postal }}>{owner.address_postal_code}</Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.household }}>{owner.household_size}</Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.notes }}>{capitalize(owner.account_notes)}</Table.Td>
            <Table.Td style={{ ...cellBase, ...colStyles.action }}>
                <div style={{ display: 'flex', justifyContent: 'end' }}>
                    <Button size="compact-sm" onClick={() => navigate(`/adminDashboard/clientList/account/${owner.username}`)}>
                        View
                    </Button>
                </div>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div className="page">
            <AdminNavBar />
            <div className="box" style={{ height: '85vh', marginLeft: '10px', marginRight: '10px' }}>
                <ActionIcon mb={10} onClick={() => navigate('/adminDashboard')}>
                    <IconArrowLeft />
                </ActionIcon>
                <div
                    style={{
                        flex: 1,
                        height: '95%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Title order={1}>Client List</Title>
                    <TextInput
                        className="search-bar"
                        size="md"
                        placeholder="Search Clients"
                        radius={30}
                        mt={15}
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            if (e.target.value.length === 0) {
                                getAllAccountOwners();
                            } else {
                                searchClients(e.target.value);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (e.target.value.length === 0) {
                                    getAllAccountOwners();
                                } else {
                                    searchClients(e.target.value);
                                }
                            }
                        }}
                        rightSection={<CloseButton onClick={() => resetSearch()} />}
                        maxLength={CHARLIMITS.openTextField}
                    />
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: 10,
                        }}
                    >
                        <Button variant="outline" onClick={handleExportData} loading={exportLoading}>
                            Export All Clients to CSV
                        </Button>
                    </div>

                    <Table.ScrollContainer
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            marginTop: 10,
                        }}
                    >
                        <Table
                            stickyHeader
                            withTableBorder
                            highlightOnHover
                            bgcolor="white"
                            w="100%"
                            style={{ tableLayout: 'fixed', width: '100%' }}
                        >
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Last Name</Table.Th>
                                    <Table.Th>First Name</Table.Th>
                                    <Table.Th>Username</Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Phone</Table.Th>
                                    <Table.Th>Address</Table.Th>
                                    <Table.Th>City</Table.Th>
                                    <Table.Th>Postal Code</Table.Th>
                                    <Table.Th>Family Members</Table.Th>
                                    <Table.Th>Account Notes</Table.Th>
                                    <Table.Th />
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{clientRows}</Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </div>
            </div>
        </div>
    );
}
