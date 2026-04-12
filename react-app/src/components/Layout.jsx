import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../index.css';

export default function Layout() {
    useEffect(() => {
        const theme = localStorage.getItem('cobuy_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    return (
        <div className="dashboard">
            <Sidebar />
            <main className="main">
                <Topbar />
                <Outlet />
            </main>
        </div>
    );
}
