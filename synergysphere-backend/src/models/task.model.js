const { query, getClient } = require('../config/db');

/**
 * Task model for database operations
 */
class TaskModel {
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} - Created task
   */
  static async create({ project_id, title, description, status = 'Pending', due_date, creator_id, assignees = [] }) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create the task
      const taskResult = await client.query(
        'INSERT INTO tasks (project_id, title, description, status, due_date, creator_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [project_id, title, description, status, due_date, creator_id]
      );
      
      const task = taskResult.rows[0];
      
      // Assign users to the task
      if (assignees.length > 0) {
        const assigneePromises = assignees.map(userId => 
          client.query(
            'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
            [task.id, userId]
          )
        );
        await Promise.all(assigneePromises);
      }
      
      // Log task creation activity
      await client.query(
        'INSERT INTO activity_logs (project_id, task_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4, $5)',
        [project_id, task.id, creator_id, 'TASK_CREATED', { 
          task_title: title,
          assignees: assignees
        }]
      );
      
      await client.query('COMMIT');
      
      return task;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find task by ID with full details
   * @param {number} id - Task ID
   * @returns {Promise<Object|null>} - Task with details
   */
  static async findById(id) {
    const result = await query(`
      SELECT 
        t.*,
        p.name as project_name,
        u.username as creator_username,
        u.full_name as creator_name,
        COUNT(DISTINCT ta.user_id) as assignee_count,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT a.id) as attachment_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON t.creator_id = u.id
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      LEFT JOIN comments c ON t.id = c.task_id
      LEFT JOIN attachments a ON t.id = a.task_id
      WHERE t.id = $1
      GROUP BY t.id, p.name, u.username, u.full_name
    `, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * Get tasks by project ID
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} - Tasks in project
   */
  static async findByProjectId(projectId) {
    const result = await query(`
      SELECT 
        t.*,
        u.username as creator_username,
        u.full_name as creator_name,
        COUNT(DISTINCT ta.user_id) as assignee_count,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT a.id) as attachment_count,
        ARRAY_AGG(DISTINCT jsonb_build_object(
          'id', ua.id,
          'username', ua.username,
          'full_name', ua.full_name
        )) FILTER (WHERE ua.id IS NOT NULL) as assignees
      FROM tasks t
      JOIN users u ON t.creator_id = u.id
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      LEFT JOIN users ua ON ta.user_id = ua.id
      LEFT JOIN comments c ON t.id = c.task_id
      LEFT JOIN attachments a ON t.id = a.task_id
      WHERE t.project_id = $1
      GROUP BY t.id, u.username, u.full_name
      ORDER BY t.created_at DESC
    `, [projectId]);
    
    return result.rows;
  }

  /**
   * Get tasks assigned to user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Assigned tasks
   */
  static async findByAssignee(userId) {
    const result = await query(`
      SELECT 
        t.*,
        p.name as project_name,
        p.id as project_id,
        u.username as creator_username,
        u.full_name as creator_name,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT a.id) as attachment_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN users u ON t.creator_id = u.id
      JOIN task_assignees ta ON t.id = ta.task_id
      LEFT JOIN comments c ON t.id = c.task_id
      LEFT JOIN attachments a ON t.id = a.task_id
      WHERE ta.user_id = $1
      GROUP BY t.id, p.name, p.id, u.username, u.full_name
      ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
    `, [userId]);
    
    return result.rows;
  }

  /**
   * Update task
   * @param {number} id - Task ID
   * @param {Object} updates - Updates to apply
   * @param {number} updater_id - ID of user making the update
   * @returns {Promise<Object>} - Updated task
   */
  static async update(id, updates, updater_id) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const allowedFields = ['title', 'description', 'status', 'due_date'];
      const fields = [];
      const values = [];
      let paramCount = 1;

      // Track what changed for activity log
      const changes = {};

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          changes[key] = value;
          paramCount++;
        }
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);
      const result = await client.query(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      const task = result.rows[0];

      // Log update activity
      await client.query(
        'INSERT INTO activity_logs (project_id, task_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4, $5)',
        [task.project_id, task.id, updater_id, 'TASK_UPDATED', changes]
      );

      await client.query('COMMIT');
      
      return task;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete task
   * @param {number} id - Task ID
   * @param {number} deleter_id - ID of user deleting the task
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id, deleter_id) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get task info before deletion
      const taskResult = await client.query(
        'SELECT project_id, title FROM tasks WHERE id = $1',
        [id]
      );
      
      if (taskResult.rows.length === 0) {
        return false;
      }
      
      const task = taskResult.rows[0];
      
      // Delete the task (cascading will handle related records)
      const deleteResult = await client.query('DELETE FROM tasks WHERE id = $1', [id]);
      
      if (deleteResult.rowCount > 0) {
        // Log deletion activity
        await client.query(
          'INSERT INTO activity_logs (project_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4)',
          [task.project_id, deleter_id, 'TASK_DELETED', { 
            task_title: task.title,
            task_id: id
          }]
        );
      }
      
      await client.query('COMMIT');
      
      return deleteResult.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get task assignees
   * @param {number} taskId - Task ID
   * @returns {Promise<Array>} - Task assignees
   */
  static async getAssignees(taskId) {
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.full_name
      FROM task_assignees ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = $1
      ORDER BY u.full_name
    `, [taskId]);
    
    return result.rows;
  }

  /**
   * Assign users to task
   * @param {number} taskId - Task ID
   * @param {Array} userIds - Array of user IDs
   * @param {number} assigner_id - ID of user making assignments
   * @returns {Promise<Array>} - Assigned users
   */
  static async assignUsers(taskId, userIds, assigner_id) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Remove existing assignments
      await client.query('DELETE FROM task_assignees WHERE task_id = $1', [taskId]);
      
      // Add new assignments
      if (userIds.length > 0) {
        const assignPromises = userIds.map(userId =>
          client.query(
            'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
            [taskId, userId]
          )
        );
        await Promise.all(assignPromises);
      }
      
      // Get task info for activity log
      const taskResult = await client.query(
        'SELECT project_id, title FROM tasks WHERE id = $1',
        [taskId]
      );
      
      if (taskResult.rows.length > 0) {
        const task = taskResult.rows[0];
        
        // Log assignment activity
        await client.query(
          'INSERT INTO activity_logs (project_id, task_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4, $5)',
          [task.project_id, taskId, assigner_id, 'TASK_ASSIGNED', { 
            task_title: task.title,
            assignees: userIds
          }]
        );
      }
      
      // Get assigned users
      const assigneesResult = await client.query(`
        SELECT 
          u.id,
          u.username,
          u.full_name
        FROM task_assignees ta
        JOIN users u ON ta.user_id = u.id
        WHERE ta.task_id = $1
        ORDER BY u.full_name
      `, [taskId]);
      
      await client.query('COMMIT');
      
      return assigneesResult.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get task comments
   * @param {number} taskId - Task ID
   * @returns {Promise<Array>} - Task comments
   */
  static async getComments(taskId) {
    const result = await query(`
      SELECT 
        c.*,
        u.username,
        u.full_name,
        COUNT(DISTINCT a.id) as attachment_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN attachments a ON c.id = a.comment_id
      WHERE c.task_id = $1
      GROUP BY c.id, u.username, u.full_name
      ORDER BY c.created_at ASC
    `, [taskId]);
    
    return result.rows;
  }

  /**
   * Add comment to task
   * @param {number} taskId - Task ID
   * @param {number} userId - User ID
   * @param {string} content - Comment content
   * @param {number} parentCommentId - Parent comment ID for replies
   * @returns {Promise<Object>} - Created comment
   */
  static async addComment(taskId, userId, content, parentCommentId = null) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      const commentResult = await client.query(
        'INSERT INTO comments (task_id, user_id, content, parent_comment_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [taskId, userId, content, parentCommentId]
      );
      
      const comment = commentResult.rows[0];
      
      // Get task info for activity log
      const taskResult = await client.query(
        'SELECT project_id, title FROM tasks WHERE id = $1',
        [taskId]
      );
      
      if (taskResult.rows.length > 0) {
        const task = taskResult.rows[0];
        
        // Log comment activity
        await client.query(
          'INSERT INTO activity_logs (project_id, task_id, user_id, activity_type, details) VALUES ($1, $2, $3, $4, $5)',
          [task.project_id, taskId, userId, 'COMMENT_ADDED', { 
            task_title: task.title,
            comment_id: comment.id
          }]
        );
      }
      
      await client.query('COMMIT');
      
      return comment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = TaskModel;
