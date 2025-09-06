import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/task.service';
import { useAuth } from '../../contexts/AuthContext';
import './TaskDetailModal.css';

const TaskDetailModal = ({ task, onClose, onTaskUpdate }) => {
  const { user } = useAuth();
  const [taskData, setTaskData] = useState(task);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    due_date: task.due_date ? task.due_date.split('T')[0] : ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchAttachments();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      const data = await taskService.getTaskComments(task.id);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const data = await taskService.getTaskAttachments(task.id);
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      setAttachments([]);
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const updatedTask = await taskService.updateTask(task.id, editForm);
      setTaskData(updatedTask);
      setIsEditing(false);
      onTaskUpdate(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await taskService.addTaskComment(task.id, newComment);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const updatedTask = await taskService.uploadTaskAttachment(task.id, file);
      setTaskData(updatedTask);
      // Refresh attachments to show new upload
      fetchAttachments();
      onTaskUpdate(updatedTask);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canEdit = user && (user.id === taskData.creator_id || user.id === taskData.assignee_id);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="task-detail-modal">
        <div className="modal-header">
          <div className="breadcrumb">
            <span>Tasks</span>
            <span className="breadcrumb-separator">/</span>
            <span className="current-task">Task Details</span>
          </div>
          <div className="header-actions">
            {canEdit && (
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(!isEditing)}
              >
                ✏️ Edit Task
              </button>
            )}
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="task-main">
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Assignee</label>
                  <input
                    type="text"
                    value={taskData.assignee_name || 'Unassigned'}
                    disabled
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={editForm.due_date}
                      onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={6}
                  />
                </div>

                <div className="edit-actions">
                  <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleSaveEdit} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="task-info">
                <h1 className="task-title">{taskData.title}</h1>
                
                <div className="task-meta">
                  <div className="meta-item">
                    <label>Assignee</label>
                    <div className="assignee-info">
                      <span className="assignee-name">
                        {taskData.assignee_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="meta-item">
                    <label>Due Date</label>
                    <span className="due-date">{formatDate(taskData.due_date)}</span>
                  </div>
                  
                  <div className="meta-item">
                    <label>Status</label>
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(taskData.status) }}
                    >
                      {taskData.status}
                    </div>
                  </div>
                </div>

                <div className="description-section">
                  <label>Description</label>
                  <div className="description-content">
                    {taskData.description || 'No description provided'}
                  </div>
                </div>

                <div className="attachments-section">
                  <div className="section-header">
                    <label>Files</label>
                    <div className="file-upload">
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="file-upload" className="upload-btn">
                        📎 {uploading ? 'Uploading...' : 'Add file'}
                      </label>
                    </div>
                  </div>
                  
                  <div className="attachments-list">
                    {attachments && attachments.length > 0 ? (
                      attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-item">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{attachment.file_name}</span>
                          <a href={`/api/tasks/${task.id}/attachments/${attachment.id}/download`} download>
                            Download
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="no-attachments">No files attached</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="task-sidebar">
            <div className="activity-section">
              <h3>Activity Feed</h3>
              <div className="activity-item">
                <div className="activity-icon status">✅</div>
                <div className="activity-content">
                  <p><strong>Status updated</strong> to In Progress by You</p>
                  <span className="activity-time">4 July 2024, 4:00 AM</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon assign">👤</div>
                <div className="activity-content">
                  <p><strong>Assigned to</strong> {taskData.assignee_name}</p>
                  <span className="activity-time">4 July 2024, 3:30 PM</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon create">📝</div>
                <div className="activity-content">
                  <p><strong>Task created</strong> by You</p>
                  <span className="activity-time">1 July 2024, 11:15 AM</span>
                </div>
              </div>
            </div>

            <div className="comments-section">
              <h3>Comments</h3>
              
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <span className="commenter-name">{comment.user_name}</span>
                      <span className="comment-time">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="comment-form">
                <div className="comment-input-container">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${user?.full_name}&background=f7d63e&color=1a202c&size=32`}
                    alt={user?.full_name}
                    className="comment-avatar"
                  />
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  <button type="submit" disabled={loading || !newComment.trim()}>
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
