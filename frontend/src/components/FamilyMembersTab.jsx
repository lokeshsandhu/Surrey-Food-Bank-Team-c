import { Title, Text, Stack, TextInput, Radio, Group, Table, ScrollArea } from "@mantine/core"
import React, { useEffect, useState } from "react"
import { getFamilyMembers } from "../../api/familyMembers";

// written with the assisstance of Gemini
export default function AccountInformationTab({ clientUsername }) {
    const token = sessionStorage.getItem('token');
    const [familyMemberInfo, setFamilyMemberInfo] = useState([]);

    if (!token) {
        navigate('/');
        return null;
    }

    const getFamilyMembersInformation = async () => {
        try {
            const familyMembers = await getFamilyMembers(token, clientUsername);
            setFamilyMemberInfo(familyMembers);
        } catch(err) {
            console.log("Big error ", err)
        }
    }

    useEffect(() => {
        getFamilyMembersInformation();
    }, [])

    const rows = familyMemberInfo.map((FM) => (
            <Table.Tr key={FM.f_name}>
            <Table.Td>{FM.f_name}</Table.Td>
            <Table.Td>{FM.l_name}</Table.Td>
            <Table.Td>{FM.dob}</Table.Td>
            <Table.Td>{FM.email}</Table.Td>
            <Table.Td>{FM.phone}</Table.Td>
            <Table.Td>{FM.relationship}</Table.Td>
            </Table.Tr>
        ));

    return (
    <ScrollArea>
      <Table miw={800} verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>First Name</Table.Th>
            <Table.Th>Last Name</Table.Th>
            <Table.Th>DOB [YYYY-MM-DD]</Table.Th>
            <Table.Th>email</Table.Th>
            <Table.Th>phone</Table.Th>
            <Table.Th>Relationship</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}