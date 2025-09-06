import React, { useState } from 'react';
import { taskService } from '../../services/task.service';
import { userService } from '../../services/user.service';
import './CreateTaskModal.css';

const CreateTaskModal = ({ projectId, onClose, onTaskCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeUsername: '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUsernameChange = async (e) => {
    const username = e.target.value;
    setFormData({
      ...formData,
      assigneeUsername: username
    });

    if (username.length > 2) {
      try {
        const results = await userService.searchUsers(username);
        setSearchResults(results);
        setShowUserSearch(true);
      } catch (error) {
        setSearchResults([]);
        setShowUserSearch(false);
      }
    } else {
      setShowUserSearch(false);
      setSearchResults([]);
    }
  };

  const selectUser = (user) => {
    setFormData({
      ...formData,
      assigneeUsername: user.username
    });
    setShowUserSearch(false);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Find user ID if username is provided
      let assignees = [];
      if (formData.assigneeUsername) {
        try {
          const users = await userService.searchUsers(formData.assigneeUsername);
          const exactMatch = users.find(user => user.username === formData.assigneeUsername);
          if (exactMatch) {
            assignees = [exactMatch.id];
          }
        } catch (error) {
          // If user search fails, continue without assignee
          console.warn('Failed to find user:', error);
        }
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        due_date: formData.dueDate || null,
        assignees
      };

      const task = await taskService.createTask(projectId, taskData);
      onTaskCreated(task);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Task Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Design new landing page"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a detailed description of the task..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="assigneeUsername">Assignee</label>
              <div className="assignee-input-container">
                <input
                  type="text"
                  id="assigneeUsername"
                  name="assigneeUsername"
                  value={formData.assigneeUsername}
                  onChange={handleUsernameChange}
                  placeholder="Enter username to assign"
                />
                {showUserSearch && searchResults.length > 0 && (
                  <div className="user-search-results">
                    {searchResults.map((user) => (
                      <div 
                        key={user.id} 
                        className="user-search-item"
                        onClick={() => selectUser(user)}
                      >
                        <div className="user-avatar">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${user.full_name}&background=f7d63e&color=1a202c&size=32`}
                            alt={user.full_name}
                          />
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.full_name}</div>
                          <div className="username">@{user.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
