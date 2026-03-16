import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaHome, FaCompass, FaSuitcase, FaUser, FaThLarge, FaUserFriends, FaPlane } from 'react-icons/fa';
import './BottomNav.css';

export default function BottomNav() {
    const location = useLocation();
    const pathname = location.pathname;
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/administracion') || pathname.startsWith('/administraci\u00f3n');
    const adminRoot = pathname.startsWith('/admin') ? '/admin' : '/administracion';

    if (isAdminRoute) {
        return (
            <nav className="bottom-nav admin-theme">
                <NavLink to={adminRoot} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
                    <FaThLarge className="nav-icon" />
                    <span>INICIO</span>
                </NavLink>

                <NavLink to={`${adminRoot}/usuarios`} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    <FaUserFriends className="nav-icon" />
                    <span>USUARIOS</span>
                </NavLink>

                <NavLink to={`${adminRoot}/lista-vuelos`} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    <FaPlane className="nav-icon" />
                    <span>VUELOS</span>
                </NavLink>
            </nav>
        );
    }

    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} end>
                <FaHome className="nav-icon" />
                <span>INICIO</span>
            </NavLink>

            <NavLink to="/resultados" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <FaCompass className="nav-icon" />
                <span>EXPLORAR</span>
            </NavLink>

            <NavLink to="/mis-viajes" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <FaSuitcase className="nav-icon" />
                <span>VIAJES</span>
            </NavLink>

            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <FaUser className="nav-icon" />
                <span>PERFIL</span>
            </NavLink>
        </nav>
    );
}


