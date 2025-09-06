import React, { useState, useEffect } from 'react';
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
        <div className="loading-spinner"></div>
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
          <span className="btn-icon">+</span>
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
            <div className="empty-icon">📁</div>
            <h3>No projects yet</h3>
            <p>Get started by creating your first project</p>
            <button 
              className="empty-action-btn"
              onClick={() => setShowCreateModal(true)}
            >
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
