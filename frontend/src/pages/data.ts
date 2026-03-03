import dayjs from 'dayjs';

const startOfWeek = dayjs().startOf('week').add(2, 'day').format('YYYY-MM-DD');
const dayAfterStartOfWeek = dayjs(startOfWeek).add(1, 'day').format('YYYY-MM-DD');

export const events = [
  {
    id: 1,
    title: 'Morning Standup',
    start: `${startOfWeek} 09:00:00`,
    end: `${startOfWeek} 09:30:00`,
    color: 'blue',
  },
  {
    id: 2,
    title: 'Team Meeting',
    start: `${startOfWeek} 10:00:00`,
    end: `${startOfWeek} 11:30:00`,
    color: 'green',
  },
  {
    id: 3,
    title: 'Code Review',
    start: `${dayAfterStartOfWeek} 14:00:00`,
    end: `${dayAfterStartOfWeek} 15:00:00`,
    color: 'violet',
  },
  {
    id: 4,
    title: 'All Day Conference',
    start: `${startOfWeek} 00:00:00`,
    end: dayjs(startOfWeek).add(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    color: 'red',
  },
];