import React from 'react';
import { Link } from 'react-router-dom';
import { FiFolder, FiArrowRight, FiCheckCircle, FiClock } from 'react-icons/fi';
import './ProjectCard.css';

const ProjectCard = ({ project }) => {
  const getTaskCount = () => {
    // This will be calculated from the project data
    const totalTasks = project.task_count || 0;
    const completedTasks = project.completed_tasks || 0;
    return { total: totalTasks, remaining: totalTasks - completedTasks };
  };

  const taskStats = getTaskCount();

  return (
    <Link to={`/projects/${project.id}`} className="project-card">
      <div className="project-card-header">
        <div className="project-icon">
          <FiFolder size={24} />
        </div>
        <div className="project-arrow">
          <FiArrowRight size={18} />
        </div>
      </div>
      
      <div className="project-content">
        <h3 className="project-name">{project.name}</h3>
        <p className="project-description">
          {project.description || 'No description available'}
        </p>
        
        <div className="project-stats">
          <div className="stat-item">
            <FiClock size={14} />
            <span>{taskStats.remaining} tasks remaining</span>
          </div>
          {taskStats.total > 0 && (
            <div className="stat-item">
              <FiCheckCircle size={14} />
              <span>{project.completed_tasks || 0} completed</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
