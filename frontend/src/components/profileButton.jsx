import { Menu } from '@mantine/core';
import pic from '../assets/pp.png';
import logout from '../assets/log-out.svg';
import React from 'react';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';

export default function ProfileButton() {
    const navigate = useNavigate();
    const link = { link: '/settings', label: 'settings' };
    const style = {
        paddingTop: "100px",
    }
    return (
        <div className="profile-button">
            <Menu withArrow position="bottom-end">
                <Menu.Target>
                    <a key={link.label} href={link.link} style={style} onClick={(event) => {
                                event.preventDefault();
                            }}>
                        <img src={pic} width={60} height={60} alt="Profile Picture"/>
                    </a>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Divider/>
                    <Menu.Item leftSection={<img src={logout} width={20} height={20} alt="Logout"/>} onClick={() => {
                        sessionStorage.removeItem('token');
                        notifications.show({
                            title: 'Logged out',
                            message: 'You have been successfully logged out.',
                            color: 'green',
                        });
                        navigate('/');
                    }}>
                        Logout
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </div>
    );
}