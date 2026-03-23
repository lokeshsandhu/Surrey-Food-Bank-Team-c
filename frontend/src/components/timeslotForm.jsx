// Heavily inspired/referenced from mantine ui's demo from https://alpha.mantine.dev/schedule/schedule/#create-and-update-events

import { useEffect, useState } from 'react';
import { Modal, TextInput, Button, Stack, Group, Checkbox } from '@mantine/core';
import React from 'react';
import { DatePickerInput, DateTimePicker, TimePicker } from '@mantine/dates';
import { isNotEmpty, useForm } from '@mantine/form';
import dayjs from 'dayjs';
import customParseFormat from "dayjs/plugin/customParseFormat";

export function TimeslotForm({ opened, onClose, onSubmit, onDelete, values, ...others }) {
  dayjs.extend(customParseFormat);

  const form = useForm({
    initialValues: {
      id: values?.id,
      title: values?.title || '',
      start: values?.start || new Date(),
      end: values?.end || new Date(),
      color: values?.color || 'blue',
      appt_notes: values?.appt_notes || '',
    },
    validate: {
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

  const [timeslotDates, setTimeslotDates] = useState([]);

  useEffect(() => {
    form.setValues({
      id: values?.id,
      title: values?.title || '',
      start: values?.start || new Date(),
      end: values?.end || new Date(),
      color: values?.color || 'blue',
      appt_notes: values?.appt_notes || '',
    });

    console.log('Received values in TimeslotForm:', values);
    setTimeslotDates([dayjs(values?.start).toDate()]);
  }, [values]);

  const handleSubmit = () => {
    onSubmit({
      dates: timeslotDates,
      start: form.values.start,
      end: form.values.end,
      appt_notes: form.values.appt_notes,
    });
    onClose();
  }

  const handleDelete = () => {
    onDelete?.(form.values);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Create Timeslot'
      radius="md"
      {...others}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">

          <DatePickerInput
            label="Timeslot Dates"
            type="multiple"
            clearable
            radius="md"
            excludeDate={(date) => new Date(date).getDay() === 0 || new Date(date).getDay() === 6}
            value={timeslotDates}
            onChange={setTimeslotDates}
          />

          <TimePicker
            label="Start Time"
            clearable
            radius="md"
            format="12h"
            value={dayjs(form.values.start).format('HH:mm')}
          />

          <TimePicker
            label="End Time"
            clearable
            radius="md"
            format="12h"
            value={dayjs(form.values.end).format('HH:mm')}
          />

          <TextInput
            label="Additional Notes"
            placeholder="Enter any additional notes for the timeslot"
            {...form.getInputProps('appt_notes')}
          />

          <Group justify="flex-end" gap="sm">
            {form.values.id && onDelete && (
              <Button color="red" onClick={handleDelete} mie="auto" radius="md">
                Delete Booking
              </Button>
            )}
            
            <Button type="submit" radius="md" disabled={timeslotDates.length === 0}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}