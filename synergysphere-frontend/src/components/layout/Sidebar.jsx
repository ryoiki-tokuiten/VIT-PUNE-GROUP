import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiCheckSquare, 
  FiFolder, 
  FiMessageCircle, 
  FiUserPlus 
} from 'react-icons/fi';
import { useInviteModal } from '../../contexts/InviteModalContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { openInviteModal } = useInviteModal();

  const sidebarItems = [
    { path: '/tasks', label: 'My Tasks', icon: FiCheckSquare },
    { path: '/projects', label: 'Projects', icon: FiFolder },
    { path: '/chat', label: 'Chat', icon: FiMessageCircle }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {sidebarItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <IconComponent className="sidebar-icon" size={20} />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="sidebar-bottom">
        <button className="invite-btn" onClick={() => openInviteModal()}>
          <FiUserPlus className="invite-icon" size={16} />
          <span>Invite teammates</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
