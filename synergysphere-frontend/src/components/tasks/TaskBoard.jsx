import React, { useState } from 'react';
import TaskDetailModal from './TaskDetailModal';
import './TaskBoard.css';

const TaskBoard = ({ tasks, onTaskUpdate }) => {
  const [selectedTask, setSelectedTask] = useState(null);

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

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
      day: 'numeric'
    });
  };

  const TaskItem = ({ task }) => (
    <div 
      className="task-item"
      onClick={() => setSelectedTask(task)}
    >
      <h4 className="task-item-title">{task.title}</h4>
      <p className="task-item-assignee">
        {task.assignee_name || 'Unassigned'}
      </p>
      <div className="task-item-footer">
        <span className="task-item-date">
          {formatDate(task.due_date)}
        </span>
        <div 
          className="task-item-status"
          style={{ backgroundColor: getStatusColor(task.status) }}
        >
          {task.status}
        </div>
      </div>
    </div>
  );

  const columns = [
    { title: 'Pending', status: 'Pending', tasks: getTasksByStatus('Pending') },
    { title: 'In Progress', status: 'In Progress', tasks: getTasksByStatus('In Progress') },
    { title: 'Completed', status: 'Completed', tasks: getTasksByStatus('Completed') }
  ];

  return (
    <div className="task-board">
      <div className="board-columns">
        {columns.map((column) => (
          <div key={column.status} className="board-column">
            <div className="column-header">
              <h3 className="column-title">{column.title}</h3>
              <span className="task-count">{column.tasks.length}</span>
            </div>
            
            <div className="column-content">
              {column.tasks.length === 0 ? (
                <div className="empty-column">
                  <p>No {column.title.toLowerCase()} tasks</p>
                </div>
              ) : (
                column.tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={onTaskUpdate}
        />
      )}
    </div>
  );
};

export default TaskBoard;
