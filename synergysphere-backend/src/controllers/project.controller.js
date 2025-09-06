const ProjectModel = require('../models/project.model');
const UserModel = require('../models/user.model');
const ProjectInvitationModel = require('../models/projectInvitation.model');
const NotificationModel = require('../models/notification.model');

/**
 * Project controller
 */
class ProjectController {
  /**
   * Create a new project
   */
  static async createProject(req, res) {
    try {
      const { name, description } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        });
      }

      if (name.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Project name cannot exceed 255 characters'
        });
      }

      const project = await ProjectModel.create({
        name: name.trim(),
        description: description?.trim() || null,
        creator_id: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project }
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get project by ID
   */
  static async getProject(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      const project = await ProjectModel.findById(parseInt(id));

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.json({
        success: true,
        data: { project }
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update project
   */
  static async updateProject(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      const updates = {};
      
      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Project name cannot be empty'
          });
        }
        if (name.length > 255) {
          return res.status(400).json({
            success: false,
            message: 'Project name cannot exceed 255 characters'
          });
        }
        updates.name = name.trim();
      }

      if (description !== undefined) {
        updates.description = description?.trim() || null;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const project = await ProjectModel.update(parseInt(id), updates);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: { project }
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      const deleted = await ProjectModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get project members
   */
  static async getProjectMembers(req, res) {
    try {
      const { projectId } = req.params;

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      const members = await ProjectModel.getMembers(parseInt(projectId));

      res.json({
        success: true,
        data: { members }
      });
    } catch (error) {
      console.error('Get project members error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Add member to project
   */
  static async addMember(req, res) {
    try {
      const { projectId } = req.params;
      const { username, role = 'Member' } = req.body;

      console.log('Add member request:', { projectId, username, role, userId: req.user.id });

      // Validate input
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required'
        });
      }

      if (!['Member', 'Admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be Member or Admin'
        });
      }

      // Find user by username
      const user = await UserModel.findByUsername(username.toLowerCase());
      if (!user) {
        console.log('User not found:', username);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('Found user:', { id: user.id, username: user.username });

      // Check if user is already a member
      const existingRole = await ProjectModel.getMemberRole(parseInt(projectId), user.id);
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'User is already a project member'
        });
      }

      // Check if invitation already exists
      const existingInvitation = await ProjectInvitationModel.getByProjectAndUser(parseInt(projectId), user.id);
      if (existingInvitation && existingInvitation.status === 'pending') {
        return res.status(409).json({
          success: false,
          message: 'User already has a pending invitation for this project'
        });
      }

      // Create invitation instead of direct membership
      const invitation = await ProjectInvitationModel.create({
        project_id: parseInt(projectId),
        inviter_id: req.user.id,
        invitee_id: user.id,
        role: role
      });

      console.log('Created invitation:', invitation);

      // Get project details for notification
      const project = await ProjectModel.findById(parseInt(projectId));
      const inviter = await UserModel.findById(req.user.id);

      // Create notification for the invited user
      await NotificationModel.create({
        user_id: user.id,
        type: 'PROJECT_INVITATION',
        title: 'Project Invitation',
        message: `${inviter.full_name} invited you to join the project "${project.name}"`,
        data: {
          invitation_id: invitation.id,
          project_id: project.id,
          project_name: project.name,
          inviter_name: inviter.full_name,
          role: role
        }
      });

      console.log('Invitation sent successfully');

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: { invitation }
      });
    } catch (error) {
      console.error('Add project member error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(req, res) {
    try {
      const { projectId, userId } = req.params;
      const { role } = req.body;

      if (isNaN(projectId) || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID or user ID'
        });
      }

      const validRoles = ['Member', 'Admin', 'Owner'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be Member, Admin, or Owner'
        });
      }

      // Don't allow changing owner role if there's only one owner
      if (role !== 'Owner') {
        const members = await ProjectModel.getMembers(parseInt(projectId));
        const owners = members.filter(m => m.role === 'Owner');
        const targetMember = members.find(m => m.id === parseInt(userId));
        
        if (targetMember && targetMember.role === 'Owner' && owners.length === 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot change role of the only project owner'
          });
        }
      }

      const updated = await ProjectModel.updateMemberRole(parseInt(projectId), parseInt(userId), role);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member role updated successfully'
      });
    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Remove member from project
   */
  static async removeMember(req, res) {
    try {
      const { projectId, userId } = req.params;

      if (isNaN(projectId) || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID or user ID'
        });
      }

      // Don't allow removing the only owner
      const members = await ProjectModel.getMembers(parseInt(projectId));
      const owners = members.filter(m => m.role === 'Owner');
      const targetMember = members.find(m => m.id === parseInt(userId));
      
      if (targetMember && targetMember.role === 'Owner' && owners.length === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the only project owner'
        });
      }

      const removed = await ProjectModel.removeMember(parseInt(projectId), parseInt(userId));

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get project activity logs
   */
  static async getProjectActivity(req, res) {
    try {
      const { projectId } = req.params;
      const { limit = 50 } = req.query;

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      const activities = await ProjectModel.getActivityLogs(parseInt(projectId), parseInt(limit));

      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      console.error('Get project activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = ProjectController;
