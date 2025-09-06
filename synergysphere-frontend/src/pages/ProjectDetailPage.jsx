import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import TaskBoard from '../components/tasks/TaskBoard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import ActivityFeed from '../components/ActivityFeed';
import { useInviteModal } from '../contexts/InviteModalContext';
import './ProjectDetailPage.css';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { openInviteModal } = useInviteModal();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks'); // tasks, activity, members

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      const [projectData, tasksData] = await Promise.all([
        projectService.getProjectById(id),
        taskService.getProjectTasks(id)
      ]);
      setProject(projectData);
      setTasks(tasksData);
      
      // Fetch members when switching to members tab or on initial load
      if (activeTab === 'members') {
        fetchMembers();
      }
    } catch (error) {
      setError('Failed to load project data');
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const membersData = await projectService.getProjectMembers(id);
      setMembers(membersData.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await projectService.removeProjectMember(id, userId);
      fetchMembers(); // Refresh members list
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member.');
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks([...tasks, newTask]);
    setShowCreateTask(false);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="error-container">
        <h2>Project not found</h2>
        <p>{error || 'The project you are looking for does not exist.'}</p>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <div className="project-header">
        <div className="project-breadcrumb">
          <span>Projects</span>
          <span className="breadcrumb-separator">/</span>
          <span className="current-project">{project.name}</span>
        </div>
        
        <div className="project-title-section">
          <h1 className="project-title">{project.name}</h1>
          <p className="project-description">{project.description}</p>
        </div>

        <div className="project-tabs">
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button 
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('members');
              if (members.length === 0) fetchMembers();
            }}
          >
            Members
          </button>
        </div>
      </div>

      <div className="project-content">
        <div className="main-section">
          {activeTab === 'tasks' && (
            <div className="tasks-section">
              <div className="section-header">
                <h2>Tasks</h2>
                <button 
                  className="create-task-btn"
                  onClick={() => setShowCreateTask(true)}
                >
                  <span className="btn-icon">+</span>
                  New Task
                </button>
              </div>
              <TaskBoard 
                tasks={tasks} 
                onTaskUpdate={handleTaskUpdated}
              />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-section">
              <h2>Activity Feed</h2>
              <ActivityFeed projectId={id} />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-section">
              <div className="section-header">
                <h2>Project Members</h2>
                <button 
                  className="invite-member-btn"
                  onClick={() => openInviteModal(id)}
                >
                  <span className="btn-icon">+</span>
                  Invite Member
                </button>
              </div>
              
              <div className="members-list">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.user_id} className="member-card">
                      <div className="member-info">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${member.full_name}&background=f7d63e&color=1a202c&size=40`}
                          alt={member.full_name}
                          className="member-avatar"
                        />
                        <div className="member-details">
                          <h4 className="member-name">{member.full_name}</h4>
                          <p className="member-email">{member.email}</p>
                          <span className={`member-role ${member.role.toLowerCase()}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      
                      <div className="member-actions">
                        <span className="join-date">
                          Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Recently'}
                        </span>
                        {member.role !== 'Owner' && (
                          <button 
                            className="remove-member-btn"
                            onClick={() => handleRemoveMember(member.user_id)}
                            title="Remove member"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-members">
                    <p>No members found. Invite team members to collaborate!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <ActivityFeed projectId={id} compact={true} />
        </div>
      </div>

      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}

    </div>
  );
};

export default ProjectDetailPage;
