import React, { useState, useEffect } from 'react';
import './ActivityFeed.css';

const ActivityFeed = ({ projectId, compact = false }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock activity data - in real implementation this would fetch from API
    const mockActivities = [
      {
        id: 1,
        type: 'TASK_COMPLETED',
        user_name: 'Sarah Chen',
        content: 'completed the task Design UI/UX',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        task_name: 'Design UI/UX'
      },
      {
        id: 2,
        type: 'COMMENT_ADDED',
        user_name: 'David Lee',
        content: 'commented on Develop Backend',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        task_name: 'Develop Backend'
      },
      {
        id: 3,
        type: 'USER_ASSIGNED',
        user_name: 'Admin',
        content: 'added Michael Brown to the project',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        type: 'DUE_DATE_CHANGED',
        user_name: 'Emily Wong',
        content: 'changed the due date for Test Application',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        task_name: 'Test Application'
      },
      {
        id: 5,
        type: 'TASK_COMPLETED',
        user_name: 'Team',
        content: 'completed the task Initial Project Setup',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        task_name: 'Initial Project Setup'
      }
    ];

    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 500);
  }, [projectId]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'TASK_COMPLETED': return '✅';
      case 'TASK_CREATED': return '📝';
      case 'COMMENT_ADDED': return '💬';
      case 'USER_ASSIGNED': return '👤';
      case 'DUE_DATE_CHANGED': return '📅';
      case 'STATUS_CHANGED': return '🔄';
      default: return '📌';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'TASK_COMPLETED': return '#10b981';
      case 'TASK_CREATED': return '#3b82f6';
      case 'COMMENT_ADDED': return '#8b5cf6';
      case 'USER_ASSIGNED': return '#f59e0b';
      case 'DUE_DATE_CHANGED': return '#ef4444';
      case 'STATUS_CHANGED': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`activity-feed ${compact ? 'compact' : ''}`}>
        <div className="activity-header">
          <h3>Activity Feed</h3>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`activity-feed ${compact ? 'compact' : ''}`}>
      <div className="activity-header">
        <h3>Activity Feed</h3>
      </div>
      
      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div 
              className="activity-icon"
              style={{ backgroundColor: getActivityColor(activity.type) }}
            >
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="activity-content">
              <div className="activity-text">
                <span className="activity-user">{activity.user_name}</span>
                <span className="activity-action">{activity.content}</span>
              </div>
              <div className="activity-time">
                {formatTimeAgo(activity.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
