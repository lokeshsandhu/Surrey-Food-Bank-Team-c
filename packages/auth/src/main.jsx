import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createTheme, MantineProvider } from '@mantine/core'

import '@mantine/core/styles.css';
import '@mantine/nprogress/styles.css'

import './index.css'

import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx';

const theme = createTheme({})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      {/* <LoginPage /> */}
      <RegisterPage />
    </MantineProvider>
  </StrictMode>
)
