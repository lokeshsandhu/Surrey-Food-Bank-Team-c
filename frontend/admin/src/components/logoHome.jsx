import logo from '../assets/SFBlogo.png';

export default function LogoHome() {
    const link = { link: '/dashboard', label: 'dashboard' };
    const styles = {

    }
    return (
        <div className="logo-home">
            <a key={link.label} href={link.link} className={styles.link} onClick={(event) => {
                        event.preventDefault();
                    }}>
                <img src={logo} width={130} height={60} alt="Surrey Food Bank Logo"/>
            </a>
        </div>
    );
}