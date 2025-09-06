import React, { useState, useEffect } from 'react';
import { FiPlus, FiFolderPlus, FiLoader } from 'react-icons/fi';
import { projectService } from '../services/project.service';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import './DashboardPage.css';

const DashboardPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAllProjects();
      console.log('Fetched projects data:', data);
      console.log('First project structure:', data[0]);
      setProjects(data);
    } catch (error) {
      setError('Failed to load projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects([...projects, newProject]);
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FiLoader className="loading-spinner" size={32} />
        <p className="loading-text">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Your Projects</h1>
          <p className="dashboard-subtitle">
            An overview of all your ongoing and completed projects.
          </p>
        </div>
        <button 
          className="create-project-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus className="btn-icon" size={18} />
          New Project
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FiFolderPlus className="empty-icon" size={64} />
            <h3>No projects yet</h3>
            <p>Get started by creating your first project and begin collaborating with your team</p>
            <button 
              className="empty-action-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <FiPlus size={16} />
              Create Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

export default DashboardPage;
