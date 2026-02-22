import pic from '../assets/pp.png';
import React from 'react';

export default function ProfileButton() {
    const link = { link: '/settings', label: 'settings' };
    const style = {
        paddingTop: "100px",
    }
    return (
        <div className="profile-button">
            <a key={link.label} href={link.link} style={style} onClick={(event) => {
                        event.preventDefault();
                    }}>
                <img src={pic} width={60} height={60} alt="Profile Picture"/>
            </a>
        </div>
    );
}