import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router';
import { AdminNavBar } from '../components/navBar';

import '../styles/adminstyles.css';
import '../styles/clientList.css';

import { ActionIcon, CloseButton, TextInput, Title, Table, Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { getFamilyMembersByFName, getFamilyMembersByLName, getOwnerFamilyMembers } from '../../api/familyMembers';
import { getAccount } from '../../api/accounts';
import { splitAddress } from '../utils/displayHelpers';

import { mkConfig, generateCsv, download } from "export-to-csv";

export default function ClientList() {

    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();

    if (!token) {
        navigate('/');
        return null;
    }

    // setting export to csv configurations
    const csvConfig = mkConfig({ useKeysAsHeaders: true });

    // state
    const [searchText, setSearchText] = useState('');
    const [accountOwners, setAccountOwners] = useState([]);

    const getAccountDetails = async (resultOwners) => {
        let accountOwnerDetails = [];
        // get account details
        if (resultOwners && Array.isArray(resultOwners) && resultOwners.length > 0) {
            accountOwnerDetails = await Promise.all(
                resultOwners.map(async (owner) => {
                    const details = await getAccount(token, owner.username);
                    const address = splitAddress(details.addr);

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
                        account_notes: details.account_notes

                    };
                })
            );
        }
        setAccountOwners(accountOwnerDetails);
    };

    // Fetch the account owners and their details
    const getAllAccountOwners = async () => {
        // get account owners
        const resultOwners = await getOwnerFamilyMembers(token);

        await getAccountDetails(resultOwners);
    };

    // Handle search locally
    const searchClients = async (input) => {
        let searchQuery = '';
        if (input && input.trim().length > 0) {
            searchQuery = input;
        } else {
            searchQuery = searchText;
        }
        const lowercaseSearchText = searchQuery.toLowerCase();

        const filtered = accountOwners.filter(d =>
            d.f_name.toLowerCase().includes(lowercaseSearchText) ||
            d.l_name.toLowerCase().includes(lowercaseSearchText) ||
            d.username.toLowerCase().includes(lowercaseSearchText)
        );

        setAccountOwners(filtered);
    };

    // Clear search
    const resetSearch = async () => {
        getAllAccountOwners();
        setSearchText('');
    };

    // Handle export clients to csv
    const handleExportData = async () => {
        getAllAccountOwners();
        const csv = generateCsv(csvConfig)(accountOwners);
        download(csvConfig)(csv);
    };

    useEffect(() => {
        getAllAccountOwners();
    }, []);

    const clientRows = accountOwners.map((owner) => (
        <Table.Tr
            key={owner.username}
        >
            <Table.Td>{owner.l_name}</Table.Td>
            <Table.Td>{owner.f_name}</Table.Td>
            <Table.Td>{owner.username}</Table.Td>
            <Table.Td>
                <a href={`mailto:${owner.email}`}>{owner.email}</a>
            </Table.Td>
            <Table.Td>{owner.phone}</Table.Td>
            <Table.Td>
                {owner.address_line1}
                {owner.address_line2 && owner.address_line2.length > 0
                    ?
                    `, ${owner.address_line2}` : null}
            </Table.Td>
            <Table.Td>{owner.address_city}</Table.Td>
            <Table.Td>{owner.address_postal_code}</Table.Td>
            <Table.Td>{owner.household_size}</Table.Td>
            <Table.Td>{owner.account_notes}</Table.Td>
            <Table.Td>
                <div style={{ display: 'flex', justifyContent: 'end' }}>
                    <Button onClick={() => navigate(`/adminDashboard/clientList/account/${owner.username}`)}>View/Edit</Button>
                </div>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div className="page">
            <AdminNavBar />
            <div className="box" style={{ height: '85vh' }}>
                <ActionIcon mb={10} onClick={() => navigate('/adminDashboard')}>
                    <IconArrowLeft />
                </ActionIcon>
                <Title order={1}>Client List</Title>
                <TextInput
                    size="md"
                    placeholder="Search Clients"
                    radius={30}
                    mt={15}
                    value={searchText}
                    onChange={e => {
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
                />
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: 10
                    }}>
                    <Button
                        variant='outline'
                        onClick={handleExportData}
                    >
                        Export all Clients to CSV
                    </Button>
                </div>
                <Table.ScrollContainer maxHeight={'80%'}>
                    <Table mt={15} stickyHeader withTableBorder highlightOnHover bgcolor='white' w={'100%'}>
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
                                <Table.Th>Household Size</Table.Th>
                                <Table.Th>Account Notes</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{clientRows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </div>
        </div>
    );
}