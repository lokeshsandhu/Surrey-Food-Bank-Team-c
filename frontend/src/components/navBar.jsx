import { useState } from 'react';
import { Container, Divider, Group } from '@mantine/core';
import styles from '../styles/navBar.module.css';
import LogoHome from './logoHome';
import ProfileButton from './profileButton';
import React from 'react';
import { useNavigate } from 'react-router';

const links = [
    { link: '/settings', label: 'Settings?' },
];
export function ClientNavBar() {
  const [active, setActive] = useState(links[0].link);
  const navigate = useNavigate();
  const placeholders = links.map((link) => (<a key={link.label} href={link.link} className={styles.link} data-active={active === link.link || undefined} onClick={(event) => {
          event.preventDefault();
          setActive(link.link);
      }}>
    {link.label}
  </a>));
  return (
    <nav className={styles.nav}>
      <header className={styles.header}>
        <Container fluid className={styles.inner}>
          <LogoHome/>
          <div className={styles.right}>
            <ProfileButton/>
          </div>
        </Container>
      </header>
    </nav>
  );
}

export function AdminNavBar() {
  const [active, setActive] = useState(links[0].link);
  const placeholders = links.map((link) => (<a key={link.label} href={link.link} className={styles.link} data-active={active === link.link || undefined} onClick={(event) => {
          event.preventDefault();
          setActive(link.link);
      }}>
    {link.label}
  </a>));
  const navigate = useNavigate();
  return (
    <nav className={styles.nav}>
      <header className={styles.header}>
        <Container fluid className={styles.inner}>
          <LogoHome/>
          <div className={styles.right}>
            <Divider orientation="vertical" size="sm" mx="sm" />
            <a className={styles.link} onClick={() => navigate('/adminDashboard/clientList')}> <h2 style={{ textAlign: 'center', cursor: 'pointer' }}> Client List </h2> </a>
            <Divider orientation="vertical" size="sm" mx="sm" />
            <a className={styles.link} onClick={() => navigate('/adminDashboard/timeslots')}> <h2 style={{ textAlign: 'center', cursor: 'pointer' }}> Timeslots Page </h2> </a>
            <Divider orientation="vertical" size="sm" mx="sm" />
            <ProfileButton/>
          </div>
        </Container>
      </header>
    </nav>
  );
}