// Heavily inspired/referenced from mantine ui's demo from https://alpha.mantine.dev/schedule/schedule/#create-and-update-events

import { useEffect, useState } from 'react';
import { Modal, TextInput, Button, Stack, Group, Checkbox, NumberInput } from '@mantine/core';
import React from 'react';
import { DatePickerInput, TimePicker, getTimeRange } from '@mantine/dates';
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
      appt_notes: values?.appt_notes || '',
      capacity: values?.capacity || 1,
    },
    validate: {
      start: isNotEmpty('Start time is required'),
      end: (value, { start }) => {
        if (!value) {
          return 'End time is required';
        }

        if (dayjs(value, "HH:mm").isBefore(dayjs(start, "HH:mm"))) {
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
      appt_notes: values?.appt_notes || '',
      capacity: values?.capacity || 1,
    });

    setTimeslotDates([dayjs(values?.start).toDate()]);
  }, [values]);

  const handleSubmit = () => {
    console.log(form.values.start, form.values.end);
    console.log(timeslotDates);
    onSubmit({
      dates: timeslotDates,
      start: form.values.start,
      end: form.values.end,
      appt_notes: form.values.appt_notes,
      capacity: form.values.capacity,
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
            excludeDate={(date) => new Date(date).getDay() === 5 || new Date(date).getDay() === 6}
            firstDayOfWeek={0}
            value={timeslotDates}
            onChange={setTimeslotDates}
          />

          <TimePicker
            label="Start Time"
            clearable
            radius="md"
            format="12h"
            value={dayjs(form.values.start).format('HH:mm')}
            onChange={(value) => form.setFieldValue('start', dayjs(value, 'HH:mm').toDate())}
          />

          <TimePicker
            label="End Time"
            clearable
            radius="md"
            format="12h"
            value={dayjs(form.values.end).format('HH:mm')}
            onChange={(value) => form.setFieldValue('end', dayjs(value, 'HH:mm').toDate())}
          />

          <NumberInput
            label="Capacity"
            radius="md"
            min={1}
            {...form.getInputProps('capacity')}
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