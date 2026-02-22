import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@mantine/core/styles.css';
import '@mantine/nprogress/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css';

import './index.css'

import { createTheme, MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router';

import ClientRoutes from './routes/index.jsx';

const theme = createTheme({
    fontFamily: 'Roboto, sans-serif',
    primaryColor: 'red',
    white: '#F2F2F2'
  });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <BrowserRouter>
        <ClientRoutes/>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
)
