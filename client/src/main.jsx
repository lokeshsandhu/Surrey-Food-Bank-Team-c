import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@mantine/core/styles.css';

import './index.css'

import { createTheme, MantineProvider } from '@mantine/core';

import App from './App.jsx'

const theme = createTheme({});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>
)
