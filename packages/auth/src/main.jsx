import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createTheme, MantineProvider } from '@mantine/core'

import '@mantine/core/styles.css';
import '@mantine/nprogress/styles.css'

import './index.css'

import App from './Login.jsx'

const theme = createTheme({})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>
)
