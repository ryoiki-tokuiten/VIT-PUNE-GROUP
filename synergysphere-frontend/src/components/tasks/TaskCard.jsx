import React from 'react';
import { Link } from 'react-router-dom';
import './TaskCard.css';

const TaskCard = ({ task, showProject = false, onTaskUpdate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ef4444';
      case 'In Progress': return '#3b82f6';
      case 'Completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dateString) => {
    if (!dateString) return null;
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(task.due_date);

  return (
    <div className="task-card">
      <div className="task-card-content">
        <div className="task-header">
          <Link to={`/tasks/${task.id}`} className="task-title">
            {task.title}
          </Link>
          <div 
            className="task-status"
            style={{ 
              backgroundColor: getStatusColor(task.status),
              color: 'white'
            }}
          >
            {task.status}
          </div>
        </div>

        {showProject && task.project_name && (
          <div className="task-project">
            <span className="project-icon">📁</span>
            <span>{task.project_name}</span>
          </div>
        )}

        {task.description && (
          <p className="task-description">
            {task.description.length > 120 
              ? `${task.description.substring(0, 120)}...` 
              : task.description
            }
          </p>
        )}

        <div className="task-footer">
          <div className="task-meta">
            <div className="task-assignee">
              <span className="assignee-avatar">
                👤
              </span>
              <span>Assigned by {task.creator_name || 'Unknown'}</span>
            </div>
            
            <div className="task-due-date">
              <span className="due-icon">📅</span>
              <span className={`due-text ${daysUntilDue !== null && daysUntilDue < 0 ? 'overdue' : daysUntilDue !== null && daysUntilDue <= 3 ? 'due-soon' : ''}`}>
                {formatDate(task.due_date)}
                {daysUntilDue !== null && (
                  <span className="days-remaining">
                    {daysUntilDue < 0 ? ` (${Math.abs(daysUntilDue)} days overdue)` : 
                     daysUntilDue === 0 ? ' (Due today)' : 
                     daysUntilDue <= 3 ? ` (${daysUntilDue} days left)` : ''}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
