import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, 
  FiBell, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiZap
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-brand">
          <FiZap className="brand-icon" size={24} />
          <span className="brand-text">SynergySphere</span>
        </Link>
      </div>

      <div className="navbar-right">
        <div className="search-container">
          <FiSearch className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search tasks..."
            className="search-input"
          />
        </div>

        <button className="notification-btn">
          <FiBell className="notification-icon" size={18} />
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
              <button className="dropdown-item">
                <FiUser size={16} />
                Profile
              </button>
              <button className="dropdown-item">
                <FiSettings size={16} />
                Settings
              </button>
              <hr />
              <button className="dropdown-item logout" onClick={handleLogout}>
                <FiLogOut size={16} />
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
