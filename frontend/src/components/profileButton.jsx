import { Menu } from '@mantine/core';
import user_icon from '../assets/user.svg';
import logout_icon from '../assets/log-out.svg';
import React from 'react';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';

export default function ProfileButton() {
    const navigate = useNavigate();

    return (
        <div className="profile-button">
            <Menu withArrow position="bottom-end">
                <Menu.Target>
                    <input type="image" src={user_icon} width={50} height={50} alt="User Profile Icon" style={{ borderRadius: '50%', cursor: 'pointer' }}/>
                </Menu.Target>

                <Menu.Dropdown>
                    {sessionStorage.getItem('role') === 'client' && (
                        <Menu.Item leftSection={<img src={user_icon} width={20} height={20} alt="Settings"/>} onClick={() => {
                            navigate('/clientDashboard/account/' + sessionStorage.getItem('username'));
                        }}>
                            Account
                        </Menu.Item>
                    )}

                    <Menu.Divider/>
                    <Menu.Item leftSection={<img src={logout_icon} width={20} height={20} alt="Logout"/>} onClick={() => {
                        sessionStorage.removeItem('token');
                        sessionStorage.removeItem('username');
                        sessionStorage.removeItem('role');
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