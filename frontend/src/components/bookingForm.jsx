// Heavily inspired/referenced from mantine ui's demo from https://alpha.mantine.dev/schedule/schedule/#create-and-update-events

import { useEffect, useState } from 'react';
import { Modal, TextInput, Text, Button, Stack, Group, NativeSelect, Box, Paper, NumberInput, useModalsStack } from '@mantine/core';
import React from 'react';
import { DateTimePicker } from '@mantine/dates';
import { isNotEmpty, useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { getOwnerFamilyMembers } from '../../api/familyMembers.js';
import AccountInformationTab from "../components/AccountInformationTab";
import back_icon from '../assets/arrow-left.svg';
import '../styles/styles.css'

export function BookingForm({ opened, onClose, onSubmit, onDeleteBooking, onDeleteTimeslot, values, bookedUsers = [], onRemoveBookedUser, removingBookingUsername, ...others }) {
  const form = useForm({
    initialValues: {
      id: values?.id,
      title: '',
      start: values?.start || new Date(),
      end: values?.end || new Date(),
      appt_notes: values?.appt_notes || '',
      capacity: values?.capacity || 1,
      mincapacity: values?.mincapacity || 1,
    },
    validate: {
      title: isNotEmpty('Event title is required'),
      start: isNotEmpty('Start time is required'),
      end: (value, { start }) => {
        if (!value) {
          return 'End time is required';
        }

        if (dayjs(value).isBefore(dayjs(start))) {
          return 'End time must be after start time';
        }

        return null;
      },
    },
  });

  const [clients, setClients] = useState([]);
  const [currClient, setCurrClient] = useState("");
  const token = sessionStorage.getItem('token');
  const stack = useModalsStack(['Manage Booking', 'User Info']);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleCloseAll = () => {
    stack.closeAll();
    onClose?.();
  };

  const handleFetchClients = async () => {
    try {
      const clients = await getOwnerFamilyMembers(token);
      setClients(clients);
      console.log(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    form.setValues({
      id: values?.id,
      title: values?.title || '',
      start: values?.start || new Date(),
      end: values?.end || new Date(),
      appt_notes: values?.appt_notes || '',
      capacity: values?.capacity || 1,
      mincapacity: values?.mincapacity || 1,
    });
    handleFetchClients();
    setCurrClient("");
  }, [values]);

  useEffect(() => {
    handleFetchClients();
  }, []);

  useEffect(() => {
    if (opened) {
      stack.open('Manage Booking');
    } else {
      stack.closeAll();
    }
  }, [opened]);

  const handleSubmit = (values) => {
    onSubmit({
      id: values.id,
      username: currClient,
      start: values.start,
      end: values.end,
      appt_notes: values.appt_notes,
      capacity: values.capacity,
    });
    handleCloseAll();
  };

  // no longer useful
  // const handleDeleteBooking = () => {
  //   onDeleteBooking?.(form.values);
  //   onClose();
  // };

  const handleDeleteTimeslot = () => {
    onDeleteTimeslot?.(form.values);
    handleCloseAll();
  }

  return (
    <Modal.Stack>
      <Modal
        {...stack.register('Manage Booking')}
        onClose={handleCloseAll}
        title="Manage Bookings"
        radius="md"
        size="lg"
        {...others}
      >
        <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: '16px', alignItems: 'start' }}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <NativeSelect
                label="Select Client to add to this timeslot"
                placeholder="Client username"
                radius="md"
                data-autofocus
                value={currClient}
                onChange={(event) => setCurrClient(event.currentTarget.value)}
                data={[...clients.map(client => ({ value: client.username, label: client.username })), { value: 'admin', label: 'Admin' }, { value: "", label: '', disabled: true, hidden: true }]}
              />

                <DateTimePicker
                  label="Start Time"
                  clearable
                  radius="md"
                  {...form.getInputProps('start')}
                  disabled
                />
                <DateTimePicker label="End Time" {...form.getInputProps('end')} clearable radius="md" disabled/>

                <NumberInput
                  label="Capacity"
                  radius="md"
                  min={form.values.mincapacity}
                  {...form.getInputProps('capacity')}
                />

                <TextInput
                  label="Additional Notes"
                  placeholder="Enter any additional notes"
                  {...form.getInputProps('appt_notes')}
                />

              <Group justify="space-between" align="flex-end" gap="sm" w="100%">

                <Button color="red" onClick={handleDeleteTimeslot} mie="auto" radius="md">
                  Delete Timeslot
                </Button>

                <Button type="submit" radius="md">
                  {form.values.id ? 'Update' : 'Create'}
                </Button>
              </Group>
            </Stack>
          </form>

          <Paper withBorder radius="md" p="sm" style={{ minHeight: '100%' }}>
            <Text fw={600} mb="xs">Current Bookings</Text>
            {bookedUsers.length === 0 ? (
              <Text c="dimmed" size="sm">No users booked</Text>
            ) : (
              <Stack gap={6}>
                {bookedUsers.map((user) => (
                  <Group key={user} justify="space-between" gap="xs" wrap="nowrap">
                    <Button size="sm" onClick={() => { stack.open('User Info'); setSelectedClient(user); }}>
                      {user}
                    </Button>
                    <Button
                      type="button"
                      size="compact-xs"
                      variant="light"
                      color="red"
                      onClick={() => onRemoveBookedUser?.(user)}
                      loading={removingBookingUsername === user}
                      disabled={!onRemoveBookedUser}
                      aria-label={`Remove booking for ${user}`}
                    >
                      X
                    </Button>
                  </Group>
                ))}
              </Stack>
            )}
          </Paper>
        </Box>
      </Modal>
      <Modal {...stack.register('User Info')} 
        onClose={() => stack.close('User Info')}
        title="User Information" 
        size="70%" 
        closeButtonProps={{
          icon: <img src={back_icon} alt="Close" />,
        }}
      >
        <AccountInformationTab clientUsername={selectedClient}/>
      </Modal>
    </Modal.Stack>
  );
}