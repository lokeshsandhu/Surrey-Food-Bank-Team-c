import logo from '../assets/SFBlogo.png';
import React from 'react';
import { useNavigate } from 'react-router';
import { me } from '../../api/auth.js';
export default function LogoHome() {
    const navigate = useNavigate();
    const link = { link: '/dashboard', label: 'dashboard' };
    const styles = {};

    const getRole = async () => {
        const token = sessionStorage.getItem('token');
        const res = await me(token);
        return res.role;
    }

    return (
        <div className="logo-home">

            <a key={link.label} href={link.link} className={styles.link} onClick={async (event) => {
                event.preventDefault();
                const role = await getRole();
                console.log(role);

                if (role === 'admin') {
                    navigate('/adminDashboard');
                } else {
                    navigate('/clientDashboard');
                }
            }}>

                <img src={logo} width={130} height={60} alt="Surrey Food Bank Logo"/>
            </a>

        </div>
    );
}