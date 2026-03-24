// Heavily inspired/referenced from mantine ui's demo from https://alpha.mantine.dev/schedule/schedule/#create-and-update-events

import { useEffect, useState } from 'react';
import { Modal, TextInput, Button, Stack, Group, NativeSelect } from '@mantine/core';
import React from 'react';
import { DateTimePicker } from '@mantine/dates';
import { isNotEmpty, useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { getOwnerFamilyMembers } from '../../api/familyMembers.js';

export function BookingForm({ opened, onClose, onSubmit, onDeleteBooking, onDeleteTimeslot, values, ...others }) {
  const form = useForm({
    initialValues: {
      id: values?.id,
      title: '',
      start: values?.start || new Date(),
      end: values?.end || new Date(),
      appt_notes: values?.appt_notes || '',
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
  const [currClient, setCurrClient] = useState("admin");
  const token = sessionStorage.getItem('token');

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
    });
    handleFetchClients();
  }, [values]);

  useEffect(() => {
    handleFetchClients();
  }, []);

  const handleSubmit = (values) => {
    onSubmit({
      id: values.id,
      username: currClient,
      start: values.start,
      end: values.end,
      appt_notes: values.appt_notes,
    });
    onClose();
  };

  const handleDeleteBooking = () => {
    onDeleteBooking?.(form.values);
    onClose();
  };

  const handleDeleteTimeslot = () => {
    onDeleteTimeslot?.(form.values);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={form.values.id ? 'Edit Event' : 'Create Event'}
      radius="md"
      {...others}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <NativeSelect
            label="Name for Booking"
            placeholder="Select a name for the booking"
            radius="md"
            data-autofocus
            value={currClient}
            onChange={(event) => setCurrClient(event.currentTarget.value)}
            data={[...clients.map(client => ({ value: client.username, label: client.username })), { value: 'admin', label: 'Admin' }]}
          />

          <DateTimePicker
            label="Start Time"
            clearable
            radius="md"
            {...form.getInputProps('start')}
            disabled
          />
          <DateTimePicker label="End Time" {...form.getInputProps('end')} clearable radius="md" disabled/>

          <TextInput
            label="Additional Notes"
            placeholder="Enter any additional notes"
            {...form.getInputProps('appt_notes')}
          />

          <Group justify="space-between" align="flex-end" gap="sm" w="100%">
            <Stack align="flex-start" gap="xs">
              <Button color="red" onClick={handleDeleteTimeslot} mie="auto" radius="md">
                Delete Timeslot
              </Button>

              <Button color="red" onClick={handleDeleteBooking} mie="auto" radius="md">
                Delete Booking
              </Button>
            </Stack>

            <Button type="submit" radius="md">
              {form.values.id ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}