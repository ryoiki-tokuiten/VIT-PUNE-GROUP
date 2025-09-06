import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import TaskBoard from '../components/tasks/TaskBoard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import ActivityFeed from '../components/ActivityFeed';
import './ProjectDetailPage.css';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
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
    } catch (error) {
      setError('Failed to load project data');
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks([...tasks, newTask]);
    setShowCreateTask(false);
  };

  const handleTaskUpdated = () => {
    fetchProjectData();
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
            onClick={() => setActiveTab('members')}
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
              <h2>Project Members</h2>
              <div className="members-placeholder">
                <p>Members management coming soon...</p>
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
