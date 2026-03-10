// Heavily inspired/referenced from mantine ui's demo from https://alpha.mantine.dev/schedule/schedule/#create-and-update-events

import { useEffect } from 'react';
import { Modal, TextInput, Button, Stack, Group, Checkbox } from '@mantine/core';
import React from 'react';
import { DateTimePicker } from '@mantine/dates';
import { isNotEmpty, useForm } from '@mantine/form';
import dayjs from 'dayjs';

export function TimeslotForm({ opened, onClose, onSubmit, onDelete, values, ...others }) {
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

  useEffect(() => {
    form.setValues({
      id: values?.id,
      title: values?.title || '',
      start: values?.start || new Date(),
      end: values?.end || new Date(),
      color: values?.color || 'blue',
      appt_notes: values?.appt_notes || '',
    });
  }, [values]);

  const handleSubmit = (values) => {
    onSubmit({
      id: values.id,
      title: values.title,
      start: values.start,
      end: values.end,
      color: values.color,
      appt_notes: values.appt_notes,
    });
    onClose();
  };

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

          <Group justify="flex-end" gap="sm">
            {form.values.id && onDelete && (
              <Button color="red" onClick={handleDelete} mie="auto" radius="md">
                Delete Booking
              </Button>
            )}
            
            <Button type="submit" radius="md">
              {form.values.id ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}