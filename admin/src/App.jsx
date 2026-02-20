import { createTheme, MantineProvider} from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css';

import './App.css'
import AdminDashboard from './pages/adminDashboard';

function App() {

  const theme = createTheme({
    fontFamily: 'Roboto, sans-serif',
    primaryColor: 'red',
    white: '#F2F2F2'
  });

  return (
    <MantineProvider theme={theme}>
      <AdminDashboard/>
    </MantineProvider>
  )
}

export default App
