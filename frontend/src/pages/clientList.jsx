import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router';
import { AdminNavBar } from '../components/navBar';

import '../styles/adminstyles.css';
import '../styles/clientList.css';

import { ActionIcon, CloseButton, TextInput, Title, Table } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { getAccount } from '../../api/accounts';
import { getFamilyMembers, getFamilyMembersByFName, getFamilyMembersByLName } from '../../api/familyMembers';

export default function ClientList() {

    const token = sessionStorage.getItem('token');
    const username = sessionStorage.getItem("username");
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');
    const [accountOwners, setAccountOwners] = useState([]);

    if (!token) {
        navigate('/');
        return null;
    }

    if (!username) {
        navigate('/');
        return null;
    }

    // TODO: Replace with API call to get all family members with relationship="owner"
    const getAllAccountOwners = () => {
        setAccountOwners([
            {
                username: 'jane123',
                f_name: 'Jane',
                l_name: 'Doe',
                dob: '1990-01-1',
                phone: '(111) 111-1111',
                email: 'jane@email.com',
                relationship: 'owner'
            },
            {
                username: 'big_jeff',
                f_name: 'Jeff',
                l_name: 'Smith',
                dob: '1980-12-30',
                phone: '(222) 222-2222',
                email: 'bigjeff@email.com',
                relationship: 'owner'
            }
        ])
    }

    const searchClients = async () => {
        //TODO: Maybe remove if backend can handle upper/lower case
        const uppercaseSearchText = searchText.charAt(0).toUpperCase() + searchText.slice(1); 
        
        const byFName = await getFamilyMembersByFName(token, uppercaseSearchText);
        const byLName = await getFamilyMembersByLName(token, uppercaseSearchText);

        const temp = byFName.concat(byLName);
        const filteredOwners = temp.filter(client => client.relationship === 'owner')

        setAccountOwners(filteredOwners);
    }

    const resetSearch = async () => {
        getAllAccountOwners();
        setSearchText('')
    }

    useEffect(() => {
        getAllAccountOwners();
    }, [])

    const clientRows = accountOwners.map((owner) => (
        <Table.Tr
            key={owner.username}
        // onClick={() => { navigate(`/profile/${owner.username}`) }}
        >
            <Table.Td>{owner.l_name}, {owner.f_name}</Table.Td>
            <Table.Td><a href={`mailto:${owner.email}`}>{owner.email}</a></Table.Td>
        </Table.Tr>
    ))

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
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (e.target.value.length === 0) {
                                getAllAccountOwners();
                            } else {
                                searchClients();
                            }
                        }
                    }}
                    rightSection={<CloseButton onClick={() => resetSearch()} />}
                />
                <Table.ScrollContainer maxHeight={'80%'} w={'100%'}>
                    <Table mt={15} stickyHeader withTableBorder highlightOnHover bgcolor='white' w={'100%'}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Last Name, First Name</Table.Th>
                                <Table.Th>Email</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{clientRows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </div>
        </div>
    )
}