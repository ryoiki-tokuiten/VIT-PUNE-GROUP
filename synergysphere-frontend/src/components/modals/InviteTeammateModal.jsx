import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/project.service';
import { userService } from '../../services/user.service';
import './InviteTeammateModal.css';

const InviteTeammateModal = ({ isOpen, onClose, projectId = null }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteRole, setInviteRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isOpen && !projectId) {
      fetchProjects();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
      setSelectedUser(null);
    }
  }, [searchQuery]);

  const fetchProjects = async () => {
    try {
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const users = await userService.searchUsers(searchQuery);
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedProject) return;

    setLoading(true);
    try {
      await projectService.addProjectMember(selectedProject, selectedUser.username, inviteRole);
      
      // Reset form
      setSearchQuery('');
      setSelectedUser(null);
      setInviteRole('Member');
      if (!projectId) setSelectedProject('');
      
      onClose(true); // Pass true to indicate success
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to invite member. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.full_name);
    setSearchResults([]);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setSearchResults([]);
    setInviteRole('Member');
    if (!projectId) setSelectedProject('');
    onClose(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="invite-teammate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Invite Team Member</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleInvite} className="invite-form">
          {!projectId && (
            <div className="form-group">
              <label>Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label>Search User</label>
            <div className="user-search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                required
              />
              {searching && <div className="search-loading">Searching...</div>}
              
              {searchResults.length > 0 && !selectedUser && (
                <div className="search-results">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="search-result-item"
                      onClick={() => handleUserSelect(user)}
                    >
                      <img 
                        src={`https://ui-avatars.com/api/?name=${user.full_name}&background=f7d63e&color=1a202c&size=32`}
                        alt={user.full_name}
                        className="user-avatar"
                      />
                      <div className="user-info">
                        <div className="user-name">{user.full_name}</div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedUser && (
                <div className="selected-user">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${selectedUser.full_name}&background=f7d63e&color=1a202c&size=32`}
                    alt={selectedUser.full_name}
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <div className="user-name">{selectedUser.full_name}</div>
                    <div className="user-username">@{selectedUser.username}</div>
                  </div>
                  <button 
                    type="button" 
                    className="clear-selection"
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchQuery('');
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="invite-btn"
              disabled={loading || !selectedUser || !selectedProject}
            >
              {loading ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteTeammateModal;
