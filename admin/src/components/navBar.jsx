import { useState } from 'react';
import { Container, Group } from '@mantine/core';
import styles from '../styles/navBar.module.css';
import LogoHome from './logoHome';
import ProfileButton from './profileButton';

const links = [
    { link: '/settings', label: 'Settings?' },
];
export default function AdminNavBar() {
  const [active, setActive] = useState(links[0].link);
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
            {/* <Group gap={5}>
              {placeholders}
            </Group> */}
            <ProfileButton/>
          </div>
        </Container>
      </header>
    </nav>
  );
}