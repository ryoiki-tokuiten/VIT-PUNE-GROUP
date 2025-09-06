const TaskModel = require('../models/task.model');
const UserModel = require('../models/user.model');

/**
 * Task controller
 */
class TaskController {
  /**
   * Create a new task
   */
  static async createTask(req, res) {
    try {
      const { projectId } = req.params;
      const { title, description, status = 'Pending', due_date, assignees = [] } = req.body;

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Task title is required'
        });
      }

      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Task title cannot exceed 255 characters'
        });
      }

      const validStatuses = ['Pending', 'In Progress', 'Completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Pending, In Progress, or Completed'
        });
      }

      // Validate due_date if provided
      let parsedDueDate = null;
      if (due_date) {
        parsedDueDate = new Date(due_date);
        if (isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due date format'
          });
        }
      }

      // Validate assignees if provided
      const validAssignees = [];
      if (assignees.length > 0) {
        for (const assigneeId of assignees) {
          if (isNaN(assigneeId)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid assignee ID'
            });
          }
          
          const user = await UserModel.findById(parseInt(assigneeId));
          if (!user) {
            return res.status(400).json({
              success: false,
              message: `User with ID ${assigneeId} not found`
            });
          }
          
          validAssignees.push(parseInt(assigneeId));
        }
      }

      const task = await TaskModel.create({
        project_id: parseInt(projectId),
        title: title.trim(),
        description: description?.trim() || null,
        status,
        due_date: parsedDueDate,
        creator_id: req.user.id,
        assignees: validAssignees
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task }
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get task by ID
   */
  static async getTask(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task ID'
        });
      }

      const task = await TaskModel.findById(parseInt(id));

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Get assignees
      const assignees = await TaskModel.getAssignees(parseInt(id));
      task.assignees = assignees;

      res.json({
        success: true,
        data: { task }
      });
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get tasks by project
   */
  static async getProjectTasks(req, res) {
    try {
      const { projectId } = req.params;

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      const tasks = await TaskModel.findByProjectId(parseInt(projectId));

      res.json({
        success: true,
        data: { tasks }
      });
    } catch (error) {
      console.error('Get project tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's assigned tasks
   */
  static async getMyTasks(req, res) {
    try {
      const tasks = await TaskModel.findByAssignee(req.user.id);

      res.json({
        success: true,
        data: { tasks }
      });
    } catch (error) {
      console.error('Get my tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update task
   */
  static async updateTask(req, res) {
    try {
      const { id } = req.params;
      const { title, description, status, due_date } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task ID'
        });
      }

      const updates = {};

      if (title !== undefined) {
        if (!title || title.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Task title cannot be empty'
          });
        }
        if (title.length > 255) {
          return res.status(400).json({
            success: false,
            message: 'Task title cannot exceed 255 characters'
          });
        }
        updates.title = title.trim();
      }

      if (description !== undefined) {
        updates.description = description?.trim() || null;
      }

      if (status !== undefined) {
        const validStatuses = ['Pending', 'In Progress', 'Completed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid status. Must be Pending, In Progress, or Completed'
          });
        }
        updates.status = status;
      }

      if (due_date !== undefined) {
        if (due_date === null) {
          updates.due_date = null;
        } else {
          const parsedDueDate = new Date(due_date);
          if (isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({
              success: false,
              message: 'Invalid due date format'
            });
          }
          updates.due_date = parsedDueDate;
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const task = await TaskModel.update(parseInt(id), updates, req.user.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: { task }
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete task
   */
  static async deleteTask(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task ID'
        });
      }

      const deleted = await TaskModel.delete(parseInt(id), req.user.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Assign users to task
   */
  static async assignUsers(req, res) {
    try {
      const { id } = req.params;
      const { assignees = [] } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task ID'
        });
      }

      // Validate assignees
      const validAssignees = [];
      for (const assigneeId of assignees) {
        if (isNaN(assigneeId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid assignee ID'
          });
        }
        
        const user = await UserModel.findById(parseInt(assigneeId));
        if (!user) {
          return res.status(400).json({
            success: false,
            message: `User with ID ${assigneeId} not found`
          });
        }
        
        validAssignees.push(parseInt(assigneeId));
      }

      const assignedUsers = await TaskModel.assignUsers(parseInt(id), validAssignees, req.user.id);

      res.json({
        success: true,
        message: 'Task assignments updated successfully',
        data: { assignees: assignedUsers }
      });
    } catch (error) {
      console.error('Assign users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get task comments
   */
  static async getTaskComments(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task ID'
        });
      }

      const comments = await TaskModel.getComments(parseInt(id));

      res.json({
        success: true,
        data: { comments }
      });
    } catch (error) {
      console.error('Get task comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Add comment to task
   */
  static async addComment(req, res) {
    try {
      const { id } = req.params;
      const { content, parent_comment_id } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task ID'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      if (content.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Comment cannot exceed 2000 characters'
        });
      }

      let parentId = null;
      if (parent_comment_id && !isNaN(parent_comment_id)) {
        parentId = parseInt(parent_comment_id);
      }

      const comment = await TaskModel.addComment(
        parseInt(id),
        req.user.id,
        content.trim(),
        parentId
      );

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment }
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = TaskController;
