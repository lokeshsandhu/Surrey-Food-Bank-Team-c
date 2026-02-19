import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import '@mantine/core/styles.css';

import ClientDashboard from './pages/clientDashboard';

import { createTheme, MantineProvider } from '@mantine/core';

function App() {
  const theme = createTheme({
    fontFamily: 'Proxima Nova, Raleway, Roboto',
    primaryColor: 'red'
  });

  return (
    <MantineProvider theme={theme}>
      <ClientDashboard/>
    </MantineProvider>
  )
}

export default App
