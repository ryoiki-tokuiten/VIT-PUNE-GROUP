import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notification.service';
import NotificationPanel from './NotificationPanel';
import './NotificationBell.css';

const NotificationBell = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getNotifications(1, 1);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleTogglePanel = () => {
    setShowPanel(!showPanel);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    fetchUnreadCount(); // Refresh count when panel closes
  };

  return (
    <>
      <button className="notification-bell" onClick={handleTogglePanel}>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      
      <NotificationPanel 
        isOpen={showPanel} 
        onClose={handleClosePanel}
      />
    </>
  );
};

export default NotificationBell;
