import { Stack, TextInput, Group, Table, Button, Modal, Select, Title, Textarea } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { createFamilyMember, deleteFamilyMember, getFamilyMembers, updateFamilyMember } from "../../api/familyMembers";
import { useDisclosure } from "@mantine/hooks";
import '../styles/clientList.css';
import { useForm } from "@mantine/form";
import dayjs from 'dayjs';
import { DateInput } from "@mantine/dates";
import { IMaskInput } from 'react-imask';
import validator from 'validator';
import { notifications } from '@mantine/notifications';
import { IconUserPlus } from '@tabler/icons-react';
import { FMRelationshipOptions } from '../constants/FormOptions';
import { useNavigate } from "react-router";
import { emailExists, updateAccount } from "../../api/accounts";
import { capitalize } from "../utils/displayHelpers";
import { CHARLIMITS } from "../constants/Validation";

// enum for the modal mode
const modeEnum = { updateMember: 1, addMember: 2 };

// written with the assisstance of Gemini
export default function FamilyMembersTab({ clientUsername }) {
  const token = sessionStorage.getItem('token');
  const navigate = useNavigate();
  const [familyMemberInfo, setFamilyMemberInfo] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);

  // Modal
  const [opened, { open, close }] = useDisclosure(false);
  // Controls the modal and type: update vs. add family member
  const [mode, setMode] = useState(modeEnum.updateMember);


  if (!token) {
    navigate('/');
    return null;
  }

  const form = useForm({
    initialValues: {
      id: null,
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
      f_name: (value) => value && value.trim().length > 0 ? null : 'Please enter their first name.',
      l_name: (value) => value && value.trim().length > 0 ? null : 'Please enter their last name.',
      dob: (value) => value && value.trim().length > 0 ? null : 'Please enter their date of birth.',
      email: (value) => {
        if (form.values.relationship === 'owner') {
          if (value.trim().length === 0 || !validator.isEmail(value)) {
            return 'Please enter a valid email (e.g. alexdoe@gmail.com).';
          }
        } else {
          if (value === null || value.trim().length === 0) {
            return null;
          } else if (!validator.isEmail(value.trim())) {
            return 'Please enter a valid email (e.g. alexdoe@gmail.com).';
          }
        }
      },
      phone: (value) => form.values.relationship === 'owner' ?
        (value.trim().length > 0 ? null : 'Please enter a valid phone number (e.g. (123) 456-7890).') : null,
      relationship: (value) => value.trim().length > 0 ? null : "Please select your relationship to this family member."
    }
  });

  // check if email exists in database
  // duplicate error if exists: true AND is_member_email: false
  const checkEmail = async () => {
    if (form.values.email === null || form.values.email.trim().length === 0) return;
    const currentEmail = form.values.email.trim();

    let currentUsername = null;
    let currentId = null;

    if (mode === modeEnum.updateMember) {
      currentUsername = clientUsername;
      currentId = form.values.id;
    }

    const result = await emailExists(currentEmail, currentId === null ? null : currentUsername, currentId);

    if (result.exists && result.is_family_member !== true) {
      form.setFieldError(
        'email',
        'Email already taken. Try a different email.'
      );
      return true;
    }

    return false;
  };

  // Gets family members under this account
  // Returns the number of family members
  const getFamilyMembersInformation = async () => {
    try {
      const familyMembers = await getFamilyMembers(token, clientUsername);
      setFamilyMemberInfo(familyMembers);
      return familyMembers.length;
    } catch (err) {
      console.log("Error getting family member information ", err);
    }
  };

  const openAddModal = () => {
    form.reset();
    setMode(modeEnum.addMember);
    open();
  };

  const openUpdateModal = (member) => {
    const curMember = {
      ...member,
      email: member.email === null ? '' : member.email,
      phone: member.phone === null ? '' : member.phone
    };
    setCurrentMember(curMember);
    form.setValues(curMember);
    setMode(modeEnum.updateMember);
    open();
  };

  const updateMember = async () => {
    const fieldsToValidate = [
      "f_name",
      "l_name",
      "dob",
      "email",
      "phone",
      "relationship"
    ];
    let hasErrors = false;

    fieldsToValidate.forEach((field) => {
      const result = form.validateField(field);
      if (result.hasError) {
        hasErrors = true;
      }
    });

    const hasDupEmail = await checkEmail();
    if (form.errors.email) return;

    if (hasDupEmail) {
      notifications.show({
        title: 'Email is already taken',
        message: 'Please enter a different email.',
        color: 'red',
      });
    } else if (!hasErrors) {
      const member = form.values;
      const memberData = {
        f_name: member.f_name.trim(),
        l_name: member.l_name.trim(),
        dob: member.dob,
        phone: member.phone,
        email: member.email.trim().length > 0 ? member.email.trim() : null,
        relationship: member.relationship
      };
      // console.log(memberData);
      try {
        const result = await updateFamilyMember(token, clientUsername, currentMember.id, memberData);
        await getFamilyMembersInformation();
        close();
        form.reset();
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
  };

  const addMember = async () => {
    const fieldsToValidate = [
      "f_name",
      "l_name",
      "dob",
      "email",
      "phone",
      "relationship"
    ];
    let hasErrors = false;

    fieldsToValidate.forEach((field) => {
      const result = form.validateField(field);
      if (result.hasError) {
        hasErrors = true;
      }
    });

    const hasDupEmail = await checkEmail();
    if (form.errors.email) return;

    if (hasDupEmail) {
      notifications.show({
        title: 'Email is already taken',
        message: 'Please enter a different email.',
        color: 'red',
      });
    } else if (!hasErrors) {
      const member = form.values;
      const memberData = {
        username: clientUsername,
        f_name: member.f_name.trim(),
        l_name: member.l_name.trim(),
        dob: member.dob,
        email: member.email.trim().length > 0 ? member.email : null,
        phone: member.phone,
        relationship: member.relationship
      };
      try {
        // Add family member
        const result = await createFamilyMember(token, memberData);
        await getFamilyMembersInformation();

        // Refetch
        const householdSize = await getFamilyMembersInformation();

        // Update the account size
        const accountUpdate = await updateAccount(token, clientUsername, {
          household_size: householdSize
        });


        close();
        form.reset();
        notifications.show({
          title: 'Saved',
          message: 'Your changes have been saved.',
          color: 'green',
        });
      } catch (err) {
        notifications.show({
          title: 'Error',
          message: 'There was a problem creating a new family member. Please try again.',
          color: 'green',
        });
      }
    } else {
      notifications.show({
        title: 'Missing Fields',
        message: 'Please fill all the required fields (*).',
        color: 'red',
      });
    }
  };

  const handleUpdateAddMember = async () => {
    if (mode === modeEnum.updateMember) {
      await updateMember();
    } else if (mode === modeEnum.addMember) {
      await addMember();
    }
  };

  const removeMember = async () => {
    if (form.values.relationship !== 'owner') {
      try {
        // Delete Request
        const result = await deleteFamilyMember(token, clientUsername, currentMember.id);

        // Refetch
        const famSize = await getFamilyMembersInformation();

        // Update the account size
        const accountUpdate = await updateAccount(token, clientUsername, {
          household_size: famSize
        });

        close();
        form.reset();
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
  };

  useEffect(() => {
    getFamilyMembersInformation();
  }, []);

  useEffect(() => {
    checkEmail();
  }, [form.values.email]);

  const cellStyle = {
    wordBreak: 'break-word'
  };

  const rows = familyMemberInfo.map((FM) => (
    <Table.Tr key={FM.id}>
      <Table.Td style={{ ...cellStyle }}>{capitalize(FM.f_name)}</Table.Td>
      <Table.Td style={{ ...cellStyle }}>{capitalize(FM.l_name)}</Table.Td>
      <Table.Td style={{ ...cellStyle }}>{FM.dob.slice(0, 10)}</Table.Td>
      <Table.Td style={{ ...cellStyle }}><a href={`mailto:${FM.email}`}>{FM.email}</a></Table.Td>
      <Table.Td style={{ ...cellStyle }}>{FM.phone}</Table.Td>
      <Table.Td style={{ ...cellStyle }}>{FM.relationship}</Table.Td>
      <Table.Td style={{ ...cellStyle }}>
        <Button size='xs'
          onClick={() => openUpdateModal(FM)}>Edit</Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <Title order={2} mb={10}>Family Members</Title>
      <Table.ScrollContainer
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <Table
          verticalSpacing="sm"
          stickyHeader
          withTableBorder
          highlightOnHover
          bgcolor='white'
          style={{ tableLayout: 'fixed' }}
          w={'100%'}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>First Name</Table.Th>
              <Table.Th>Last Name</Table.Th>
              <Table.Th>Date of Birth</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Relationship</Table.Th>
              <Table.Th>
                <Button
                  size='xs'
                  color='green'
                  leftSection={<IconUserPlus />}
                  onClick={openAddModal}
                >
                  Add
                </Button>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Modal
        opened={opened}
        onClose={close}
        title={mode === modeEnum.updateMember ? 'Edit Family Member' : 'Add Family Member'}
        centered>
        <Stack w='100%'>
          <Group>
            <Textarea
              label="First Name"
              placeholder="e.g. Alex"
              key={form.key(`f_name`)}
              {...form.getInputProps(`f_name`)}
              withAsterisk
              w={'45%'}
              autosize
              maxLength={CHARLIMITS.name}
            />
            <Textarea
              label="Last Name"
              placeholder="e.g. Doe"
              key={form.key(`l_name`)}
              {...form.getInputProps(`l_name`)}
              withAsterisk
              w={'45%'}
              autosize
              maxLength={CHARLIMITS.name}
            />
          </Group>
          <DateInput
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            valueFormat='YYYY-MM-DD'
            defaultDate={dayjs()}
            maxDate={dayjs()}
            minDate={dayjs().subtract(120, 'year').toDate()}
            key={form.key(`dob`)}
            {...form.getInputProps(`dob`)}
            withAsterisk
            w={'45%'}
          />
          <Textarea
            label={`Email ${form.values.relationship !== 'owner' ? '(Optional)' : ''}`}
            placeholder="e.g. alexdoe@gmail.com"
            key={form.key(`email`)}
            {...form.getInputProps(`email`)}
            onBlur={async (event) => {
              form.getInputProps('email').onBlur(event);
              await checkEmail();
            }}
            withAsterisk={form.values.relationship === 'owner'}
            autosize
            maxLength={CHARLIMITS.email}
          />
          <TextInput
            label={`Phone ${form.values.relationship !== 'owner' ? '(Optional)' : ''}`}
            placeholder="e.g. (123) 456-7890"
            key={form.key(`phone`)}
            {...form.getInputProps(`phone`)}
            component={IMaskInput}
            mask='(000) 000-0000'
            w={'45%'}
            withAsterisk={form.values.relationship === 'owner'}
          />

          {form.values.relationship !== 'owner' &&
            <Select
              label='Relationship to Account Owner'
              placeholder='Select Relationship'
              description='i.e. If this family member is your mother, select the "Parent" option.'
              data={FMRelationshipOptions}
              key={form.key(`relationship`)}
              {...form.getInputProps(`relationship`)}
              withAsterisk
              w={'100%'}
            />}
          {
            form.values.relationship === 'owner' &&
            <TextInput
              variant='unstyled'
              label='Relationship to Account Owner'
              value={form.values.relationship}
              readOnly
              w={'100%'}
            />
          }
        </Stack>
        <Group w='100%' display={'flex'} mt={20}
          style={{ justifyContent: 'space-between' }}>
          {mode === modeEnum.updateMember &&
            <Button
              color='red'
              disabled={form.values.relationship === 'owner'}
              onClick={removeMember} >
              Remove
            </Button>
          }
          <Button color='teal' onClick={handleUpdateAddMember}>Save</Button>
        </Group>
      </Modal>
    </div>
  );
};
