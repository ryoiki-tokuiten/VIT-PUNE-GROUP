import React, { useState, useEffect } from 'react';
import { taskService } from '../services/task.service';
import TaskCard from '../components/tasks/TaskCard';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import './MyTasksPage.css';

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, in-progress, completed
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const data = await taskService.getMyTasks();
      setTasks(data);
    } catch (error) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = () => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => {
      switch (filter) {
        case 'pending': return task.status === 'Pending';
        case 'in-progress': return task.status === 'In Progress';
        case 'completed': return task.status === 'Completed';
        default: return true;
      }
    });
  };

  const getTaskCountByStatus = (status) => {
    return tasks.filter(task => task.status === status).length;
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const filteredTasks = getFilteredTasks();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="my-tasks-page">
      <div className="tasks-header">
        <h1>My Tasks</h1>
        <p className="tasks-subtitle">
          All tasks assigned to you across different projects.
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tasks-stats">
        <div className="stat-card">
          <div className="stat-number">{getTaskCountByStatus('Pending')}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{getTaskCountByStatus('In Progress')}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{getTaskCountByStatus('Completed')}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="tasks-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Tasks ({tasks.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({getTaskCountByStatus('Pending')})
        </button>
        <button 
          className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
          onClick={() => setFilter('in-progress')}
        >
          In Progress ({getTaskCountByStatus('In Progress')})
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({getTaskCountByStatus('Completed')})
        </button>
      </div>

      <div className="tasks-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No tasks found</h3>
            <p>
              {filter === 'all' 
                ? 'You don\'t have any assigned tasks yet.'
                : `No ${filter.replace('-', ' ')} tasks found.`
              }
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              showProject={true}
              onTaskUpdate={fetchMyTasks}
              onTaskClick={handleTaskClick}
              useModal={true}
            />
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={handleCloseTaskModal}
          onTaskUpdate={fetchMyTasks}
        />
      )}
    </div>
  );
};

export default MyTasksPage;
