import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css';

import ClientDashboard from './pages/clientDashboard';

import { createTheme, MantineProvider} from '@mantine/core';

function App() {
  const theme = createTheme({
    fontFamily: 'Roboto, sans-serif',
    primaryColor: 'red',
    white: '#F2F2F2'
  });

  return (
    <MantineProvider theme={theme}>
      <ClientDashboard/>
    </MantineProvider>
  )
}

export default App
