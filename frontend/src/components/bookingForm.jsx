// Heavily inspired/referenced from mantine ui's demo from https://alpha.mantine.dev/schedule/schedule/#create-and-update-events

import { useEffect, useState } from 'react';
import { Modal, TextInput, Text, Button, Stack, Group, NativeSelect, Box, Paper, NumberInput, useModalsStack, Tabs, LoadingOverlay, Textarea, Select } from '@mantine/core';
import React from 'react';
import { DateTimePicker } from '@mantine/dates';
import { isNotEmpty, useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { getOwnerFamilyMembers } from '../../api/familyMembers.js';
import AccountInformationTab from "../components/AccountInformationTab";
import back_icon from '../assets/arrow-left.svg';
import '../styles/styles.css';
import { getUsernameAppointments, BOOKING_STATUS, updateBookingStatus } from '../../api/appointments.js';
import customParseFormat from "dayjs/plugin/customParseFormat";
import { CHARLIMITS } from '../constants/Validation.js';

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
  const [clientNotes, setClientNotes] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [bookingStatuses, setBookingStatuses] = useState({});

  dayjs.extend(customParseFormat);

  const fetchBooking = async (clientUsername) => {
    const res = await getUsernameAppointments(token, clientUsername);
    const booking = res.filter(appt => {
      return dayjs(values.start).isSame(dayjs(appt.appt_date), 'day') && 
      dayjs(appt.start_time, "HH:mm").format('HH:mm') === dayjs(values.start).format('HH:mm');
    });
    console.log(booking);
    return booking;
  };

  const fetchNotesForClient = async (clientUsername) => {
    setLoadingNotes(true);
    try {
      const booking = await fetchBooking(clientUsername);
      const notes = booking.length > 0 ? booking[0].booking_notes : "No additional notes for this appointment.";
      setClientNotes(notes);
    } catch (error) {
      console.error('Error fetching notes for client:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchBookingStatus = async (clientUsername) => {
    try {
      const booking = await fetchBooking(clientUsername);
      console.log(booking)
      const status = booking.length > 0 ? booking[0].booking_status : BOOKING_STATUS.DID_NOT_SHOW;
      return status;
    }
    catch (error) {
      console.error('Error fetching booking status for client:', error);
    }
  };

  const handleCloseAll = () => {
    stack.closeAll();
    onClose?.();
  };

  const handleFetchClients = async () => {
    try {
      const clients = await getOwnerFamilyMembers(token);
      setClients(clients);
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
    const loadBookingStatuses = async () => {
      if (!bookedUsers.length) {
        setBookingStatuses({});
        return;
      }

      const statuses = await Promise.all(
        bookedUsers.map(async (user) => [user, await fetchBookingStatus(user)])
      );

      console.log(statuses)

      setBookingStatuses(Object.fromEntries(statuses));
    };

    loadBookingStatuses();
  }, [bookedUsers, values]);

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

  const handleDeleteTimeslot = () => {
    onDeleteTimeslot?.(form.values);
    handleCloseAll();
  };

  return (
    <Modal.Stack>
      <Modal
        {...stack.register('Manage Booking')}
        onClose={handleCloseAll}
        title="Manage Bookings"
        radius="md"
        size="xl"
        {...others}
      >
        <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '16px', alignItems: 'start' }}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Select
                label="Select Client to add to this timeslot"
                placeholder="Client username"
                radius="md"
                data-autofocus
                searchable
                maxDropdownHeight={120}
                value={currClient}
                onChange={(value) => setCurrClient(value)} 
                data={[
                  ...clients.map(client => ({ value: client.username, label: client.username })),
                ]}
              />

              <DateTimePicker
                label="Start Time"
                clearable
                radius="md"
                {...form.getInputProps('start')}
                disabled
              />
              <DateTimePicker label="End Time" {...form.getInputProps('end')} clearable radius="md" disabled />

              <NumberInput
                label="Capacity"
                radius="md"
                min={form.values.mincapacity}
                {...form.getInputProps('capacity')}
              />

              <Textarea
                label="Admin Timeslot Notes (not visible to clients)"
                placeholder="Enter any additional notes for this timeslot"
                {...form.getInputProps('appt_notes')}
                maxLength={CHARLIMITS.openTextField}
                autosize
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
                    <Button size="xs" onClick={() => {{stack.open('User Info'); setSelectedClient(user); }}}>
                      {user}
                    </Button>
                    <NativeSelect
                      data={[
                        { value: BOOKING_STATUS.UPCOMING, label: 'Upcoming' },
                        { value: BOOKING_STATUS.ARRIVED, label: 'Arrived' },
                        { value: BOOKING_STATUS.DID_NOT_SHOW, label: 'Did Not Show' },
                      ]}
                      value={bookingStatuses[user] || BOOKING_STATUS.DID_NOT_SHOW}
                      onChange={async (event) => {
                        const nextStatus = event.currentTarget.value;
                        setBookingStatuses((current) => ({ ...current, [user]: nextStatus }));
                        await updateBookingStatus(
                          token,
                          dayjs(form.values.start).format('YYYY-MM-DD'),
                          dayjs(form.values.start).format('HH:mm'),
                          user,
                          nextStatus
                        );
                      }}

                    />
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
          icon: <img src={back_icon} alt="Back" />,
        }}
      >

        <Tabs defaultValue="client-info" onChange={(value) => {
          if (value === 'appt-notes') {
            fetchNotesForClient(selectedClient);
          }
        }}>
          <Tabs.List>
            <Tabs.Tab value="client-info">
              Client Information
            </Tabs.Tab>
            <Tabs.Tab value="appt-notes">
              Appointment Notes
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="client-info" pt="xs">
            <AccountInformationTab clientUsername={selectedClient} />
          </Tabs.Panel>
          <Tabs.Panel value="appt-notes" pt="xs">
            <LoadingOverlay visible={loadingNotes} />
            <Text>{clientNotes || "No additional notes for this appointment."}</Text>

            
            { //TODO: allow editing notes here and saving changes, but requires changes to API to update notes without changing other booking details
            /* <Button size="md" mt="md" onClick={() => updateAppointment(token, selectedClient)}>
              Update Notes
            </Button> */}
          </Tabs.Panel>
        </Tabs>

      </Modal>
    </Modal.Stack>
  );
}