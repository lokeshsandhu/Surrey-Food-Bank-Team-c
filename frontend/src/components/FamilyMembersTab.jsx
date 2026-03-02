import { Title, Text, Stack, TextInput, Radio, Group, Table, ScrollArea, Button, Modal } from "@mantine/core"
import React, { useEffect, useState } from "react"
import { deleteFamilyMember, getFamilyMembers, updateFamilyMember } from "../../api/familyMembers";
import { useDisclosure } from "@mantine/hooks";
import '../styles/clientList.css';
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { IMaskInput } from 'react-imask'
import validator from 'validator'
import { notifications } from '@mantine/notifications';


// written with the assisstance of Gemini
export default function FamilyMembersTab({ clientUsername }) {
  const token = sessionStorage.getItem('token');
  const [familyMemberInfo, setFamilyMemberInfo] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);

  if (!token) {
    navigate('/');
    return null;
  }

  const form = useForm({
    initialValues: {
      f_name: '',
      l_name: '',
      dob: null,
      phone: '',
      email: '',
      relationship: ''
    },
    validateInputOnBlur: true,
    validateInputOnChange: true,
    validate: {
      l_name: (value) => value && value.length > 0 ? null : 'Please enter their last name.',
      dob: (value) => value && value.length > 0 ? null : 'Please enter their date of birth.',
      email: (value) => value && value.length > 0 && validator.isEmail(value) ? null : 'Please enter a valid email (e.g. johndoe@gmail.com).',
      relationship: (value) => value.length > 0 ? null : 'Please enter your relationship to this family member.'
    }
  })


  const getFamilyMembersInformation = async () => {
    try {
      const familyMembers = await getFamilyMembers(token, clientUsername);
      setFamilyMemberInfo(familyMembers);
    } catch (err) {
      console.log("Big error ", err)
    }
  }

  const handleEditMember = (member) => {
    setCurrentMember(member);
    form.setValues(member);
    open();
  }

  const updateMember = async () => {
    const fieldsToValidate = [
      "l_name",
      "dob",
      "email",
      "relationship"
    ]
    let hasErrors = false;

    fieldsToValidate.forEach((field) => {
      const result = form.validateField(field);
      if (result.hasError) {
        hasErrors = true;
      }
    });

    if (!hasErrors) {
      const member = form.values
      const memberData = {
        l_name: member.l_name,
        dob: member.dob,
        phone: member.phone,
        email: member.email,
        relationship: member.relationship
      }
      try {
        const result = await updateFamilyMember(token, clientUsername, form.values.f_name, memberData)
        await getFamilyMembersInformation();
        close();
        notifications.show({
          title: 'Saved',
          message: 'Your changes have been saved.',
          color: 'green',
        });
      } catch (err) {
        notifications.show({
          title: 'Error',
          message: 'There was a problem when saving your changes. Please try again.',
          color: 'green',
        });
      }
    }

  }

  const removeMember = async () => {
    try {
      const result = await deleteFamilyMember(token, clientUsername, form.values.f_name)
      await getFamilyMembersInformation();
      close();
      notifications.show({
        title: 'Saved',
        message: 'Your changes have been saved.',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'There was a problem when saving your changes. Please try again.',
        color: 'green',
      });
    }
  }

  useEffect(() => {
    getFamilyMembersInformation();
  }, [])

  const rows = familyMemberInfo.map((FM) => (
    <Table.Tr key={FM.f_name}>
      <Table.Td>{FM.f_name}</Table.Td>
      <Table.Td>{FM.l_name}</Table.Td>
      <Table.Td>{FM.dob.slice(0, 10)}</Table.Td>
      <Table.Td>{FM.email}</Table.Td>
      <Table.Td>{FM.phone}</Table.Td>
      <Table.Td>{FM.relationship}</Table.Td>
      <Table.Td>
        <Button size='xs'
          onClick={() => handleEditMember(FM)}>Edit</Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div >
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
              <Table.Th>First Name</Table.Th>
              <Table.Th>Last Name</Table.Th>
              <Table.Th>DOB</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Relationship</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Modal opened={opened} onClose={close} title='Edit Family Member' centered>
        <Stack w='100%'>
          <Group>
            <TextInput
              variant='unstyled'
              label="First Name"
              value={form.values.f_name}
              withAsterisk
              w={'45%'}
              readOnly
            />
            <TextInput
              label="Last Name"
              placeholder="e.g. Doe"
              key={form.key(`l_name`)}
              {...form.getInputProps(`l_name`)}
              withAsterisk
              w={'45%'}
            />
          </Group>
          <DateInput
            label="Date of Birth"
            placeholder="YYYY MM DD"
            valueFormat='YYYY MM DD'
            maxDate={new Date()}
            key={form.key(`dob`)}
            {...form.getInputProps(`dob`)}
            withAsterisk
            w={'45%'}
          />
          <TextInput
            label="Email"
            placeholder="e.g. alexdoe@gmail.com"
            key={form.key(`email`)}
            {...form.getInputProps(`email`)}
            w={'45%'}
            withAsterisk
          />
          <TextInput
            label="Phone"
            placeholder="e.g. (123) 456-7890"
            key={form.key(`phone`)}
            {...form.getInputProps(`phone`)}
            component={IMaskInput}
            mask='(000) 000-0000'
            w={'45%'}
          />
          <TextInput
            variant={form.values.relationship === 'owner' ? "unstyled" : "default"}
            label="Relationship"
            placeholder="e.g. Daughter, Son"
            key={form.key(`relationship`)}
            {...form.getInputProps(`relationship`)}
            withAsterisk
            w={'45%'}
            readOnly={form.values.relationship === 'owner'}
          />
        </Stack>
        <Group w='100%' display={'flex'} mt={20}
          style={{ justifyContent: 'space-between' }}>
          <Button color='red' onClick={removeMember}>Remove</Button>
          <Button onClick={updateMember}>Save</Button>
        </Group>
      </Modal>
    </div>
  );
}