import { useLocation } from 'react-router-dom';
import '../dashboard.css';

const PAGE_META = {
    '/dashboard': {
        icon: 'fa-th-large',
        title: 'Dashboard',
        subtitle: 'Your live sales intelligence overview',
    },
    '/analytics': {
        icon: 'fa-project-diagram',
        title: 'Analytics',
        subtitle: 'Upload sales data and discover market basket associations',
    },
    '/settings': {
        icon: 'fa-sliders-h',
        title: 'Settings',
        subtitle: 'Algorithm thresholds and system preferences',
    },
    '/evaluation': {
        icon: 'fa-microscope',
        title: 'System Evaluation',
        subtitle: 'Assessing quality and user acceptance metrics',
    },
    '/profile': {
        icon: 'fa-user-circle',
        title: 'User Profile',
        subtitle: 'Manage your account and view activity logs',
    },
};

export default function Topbar() {
    const { pathname } = useLocation();

    // Fallback meta if the path is not found in the mapping
    const meta = PAGE_META[pathname] ?? { icon: 'fa-circle', title: 'CoBuy', subtitle: '' };

    return (
        <div className="topbar">
            {/* Left Section: Icon and Dynamic Title */}
            <div className="topbar-left">
                <div className="topbar-icon">
                    <i className={`fas ${meta.icon}`}></i>
                </div>
                <div>
                    <h3 className="topbar-title">
                        {/* If the title is "CoBuy", split the colors. Otherwise, show page title. */}
                        {meta.title === 'CoBuy' ? (
                            <>
                                <span style={{ color: '#ffffff' }}>Co</span>
                                <span style={{ color: '#818cf8' }}>Buy</span>
                            </>
                        ) : (
                            meta.title
                        )}
                    </h3>
                    {meta.subtitle && <span className="topbar-sub">{meta.subtitle}</span>}
                </div>
            </div>

            {/* Right side is now clean (Analysis Ready and Date removed) */}
            <div className="topbar-right">
                {/* Space reserved for future global actions if needed */}
            </div>
        </div>
    );
}