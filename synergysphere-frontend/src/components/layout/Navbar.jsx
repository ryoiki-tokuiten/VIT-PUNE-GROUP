import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/tasks', label: 'Tasks', icon: '✓' },
    { path: '/projects', label: 'Projects', icon: '📁' },
    { path: '/team', label: 'Team', icon: '👥' }
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">SynergySphere</span>
        </Link>
        
        <div className="navbar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="navbar-right">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search tasks..."
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <button className="notification-btn">
          <span className="notification-icon">🔔</span>
          <span className="notification-badge">3</span>
        </button>

        <div className="user-menu-container">
          <button 
            className="user-avatar"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img 
              src={`https://ui-avatars.com/api/?name=${user?.full_name}&background=f7d63e&color=1a202c`}
              alt={user?.full_name}
            />
          </button>
          
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-name">{user?.full_name}</div>
                <div className="user-username">@{user?.username}</div>
              </div>
              <hr />
              <button className="dropdown-item">Profile</button>
              <button className="dropdown-item">Settings</button>
              <hr />
              <button className="dropdown-item logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
