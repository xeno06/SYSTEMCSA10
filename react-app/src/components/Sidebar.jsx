import { NavLink, useNavigate } from 'react-router-dom';
import '../dashboard.css';

const MAIN_MENU = [
    { to: '/dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { to: '/analytics', icon: 'fa-project-diagram', label: 'Analytics' },
    { to: '/settings', icon: 'fa-sliders-h', label: 'Settings' },
];

const ACCOUNT_MENU = [
    { to: '/', icon: 'fa-home', label: 'Landing Page' },
    { to: '/profile', icon: 'fa-user-circle', label: 'User Profile' },
];

export default function Sidebar() {
    const navigate = useNavigate();

    return (
        <aside className="sidebar">
            {/* ── BRANDING LOGO (Reverted and Locked Colors) ── */}
            <div
                className="sidebar-logo"
                onClick={() => navigate('/')}
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 15px',
                    marginBottom: '20px'
                }}
            >
                {/* Original Emerald Green Icon */}
                <i className="fas fa-chart-line" style={{
                    marginRight: '12px',
                    color: '#10b981', // Emerald Green
                    fontSize: '24px',
                    filter: 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.2))'
                }}></i>

                <span style={{ fontWeight: '900', fontSize: '24px', letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#ffffff' }}>Co</span>
                    <span style={{ color: '#818cf8' }}>Buy</span> {/* Locked Indigo Color */}
                </span>
            </div>

            {/* Main Menu Section */}
            <div className="sidebar-section-label">MAIN MENU</div>
            <ul className="sidebar-list">
                {MAIN_MENU.map((item) => (
                    <li key={item.to}>
                        <NavLink to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <i className={`fas ${item.icon} nav-icon`}></i>
                            <span>{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>

            {/* Account Section */}
            <div className="sidebar-section-label account-label">ACCOUNT</div>
            <ul className="sidebar-list">
                {ACCOUNT_MENU.map((item) => (
                    <li key={item.to}>
                        <NavLink to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <i className={`fas ${item.icon} nav-icon`}></i>
                            <span>{item.label}</span>
                        </NavLink>
                    </li>
                ))}

                {/* Logout Button */}
                <li className="nav-link logout-btn" onClick={() => navigate('/auth')}>
                    <i className="fas fa-sign-out-alt nav-icon"></i>
                    <span>Logout</span>
                </li>
            </ul>
        </aside>
    );
}