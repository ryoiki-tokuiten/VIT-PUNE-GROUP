import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const sidebarItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/tasks', label: 'My Tasks', icon: '✓' },
    { path: '/projects', label: 'Projects', icon: '📁' },
    { path: '/inbox', label: 'Inbox', icon: '📧' },
    { path: '/reports', label: 'Reports', icon: '📊' }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {sidebarItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="sidebar-bottom">
        <button className="invite-btn">
          <span className="invite-icon">👥</span>
          <span>Invite teammates</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
