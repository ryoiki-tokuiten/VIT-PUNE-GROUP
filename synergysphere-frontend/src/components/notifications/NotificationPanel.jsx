import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notification.service';
import { projectService } from '../../services/project.service';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      console.log('Fetched notification data:', data);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAcceptInvitation = async (invitationId, notificationId) => {
    try {
      await notificationService.acceptInvitation(invitationId);
      await handleMarkAsRead(notificationId);
      
      // Remove the notification from the list
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
      
      // Refresh projects list (if needed)
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (invitationId, notificationId) => {
    try {
      await notificationService.declineInvitation(invitationId);
      await handleMarkAsRead(notificationId);
      
      // Remove the notification from the list
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel-backdrop" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="notification-content">
          {loading ? (
            <div className="notification-loading">
              <div className="loading-spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => {
                console.log('Rendering notification:', notification);
                return (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  >
                    <div className="notification-content-text">
                      <h4 className="notification-title">
                        {notification.title || 'Notification'}
                      </h4>
                      <p className="notification-message">
                        {notification.message || 'No message content'}
                      </p>
                      <span className="notification-time">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>

                    {notification.type === 'PROJECT_INVITATION' && notification.data && (
                    <div className="notification-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => handleAcceptInvitation(
                          notification.data.invitation_id, 
                          notification.id
                        )}
                      >
                        Accept
                      </button>
                      <button 
                        className="decline-btn"
                        onClick={() => handleDeclineInvitation(
                          notification.data.invitation_id, 
                          notification.id
                        )}
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {!notification.is_read && notification.type !== 'PROJECT_INVITATION' && (
                    <button 
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
