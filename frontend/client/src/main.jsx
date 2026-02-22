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

const theme = createTheme({});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <ClientRoutes/>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
)
