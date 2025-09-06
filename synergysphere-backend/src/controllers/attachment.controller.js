const { query } = require('../config/db');
const path = require('path');
const fs = require('fs');

/**
 * Attachment controller for file uploads
 */
class AttachmentController {
  /**
   * Upload files to task
   */
  static async uploadTaskFiles(req, res) {
    try {
      const { taskId } = req.params;

      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task ID'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Verify task exists and user has access
      const taskResult = await query('SELECT id, project_id FROM tasks WHERE id = $1', [taskId]);
      if (taskResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const attachments = [];

      // Save file metadata to database
      for (const file of req.files) {
        const attachmentResult = await query(
          'INSERT INTO attachments (file_name, file_path, mime_type, uploader_id, task_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [file.originalname, file.path, file.mimetype, req.user.id, parseInt(taskId)]
        );

        attachments.push({
          ...attachmentResult.rows[0],
          url: `/api/attachments/${attachmentResult.rows[0].id}`
        });
      }

      const task = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      const taskAttachments = await query('SELECT * FROM attachments WHERE task_id = $1', [taskId]);
      task.rows[0].attachments = taskAttachments.rows;

      res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
        data: { task: task.rows[0] }
      });
    } catch (error) {
      console.error('Upload task files error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Upload files to comment
   */
  static async uploadCommentFiles(req, res) {
    try {
      const { commentId } = req.params;

      if (isNaN(commentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid comment ID'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Verify comment exists and user has access
      const commentResult = await query('SELECT id FROM comments WHERE id = $1', [commentId]);
      if (commentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const attachments = [];

      // Save file metadata to database
      for (const file of req.files) {
        const attachmentResult = await query(
          'INSERT INTO attachments (file_name, file_path, mime_type, uploader_id, comment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [file.originalname, file.path, file.mimetype, req.user.id, parseInt(commentId)]
        );

        attachments.push({
          ...attachmentResult.rows[0],
          url: `/api/attachments/${attachmentResult.rows[0].id}`
        });
      }

      res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
        data: { attachments }
      });
    } catch (error) {
      console.error('Upload comment files error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get attachment by ID and serve file
   */
  static async getAttachment(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attachment ID'
        });
      }

      // Get attachment details
      const attachmentResult = await query(`
        SELECT a.*, t.project_id, c.task_id as comment_task_id, c.project_id as comment_project_id
        FROM attachments a
        LEFT JOIN tasks t ON a.task_id = t.id
        LEFT JOIN comments c ON a.comment_id = c.id
        WHERE a.id = $1
      `, [parseInt(id)]);

      if (attachmentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      const attachment = attachmentResult.rows[0];

      // Check if file exists
      if (!fs.existsSync(attachment.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', attachment.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);

      // Stream the file
      const fileStream = fs.createReadStream(attachment.file_path);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Get attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Download attachment
   */
  static async downloadAttachment(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attachment ID'
        });
      }

      // Get attachment details
      const attachmentResult = await query('SELECT * FROM attachments WHERE id = $1', [parseInt(id)]);

      if (attachmentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      const attachment = attachmentResult.rows[0];

      // Check if file exists
      if (!fs.existsSync(attachment.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Set download headers
      res.setHeader('Content-Type', attachment.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);

      // Stream the file
      const fileStream = fs.createReadStream(attachment.file_path);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Download attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete attachment
   */
  static async deleteAttachment(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attachment ID'
        });
      }

      // Get attachment details and check ownership
      const attachmentResult = await query(
        'SELECT * FROM attachments WHERE id = $1 AND uploader_id = $2',
        [parseInt(id), req.user.id]
      );

      if (attachmentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found or access denied'
        });
      }

      const attachment = attachmentResult.rows[0];

      // Delete from database
      await query('DELETE FROM attachments WHERE id = $1', [parseInt(id)]);

      // Delete file from filesystem
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }

      res.json({
        success: true,
        message: 'Attachment deleted successfully'
      });
    } catch (error) {
      console.error('Delete attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get task attachments
   */
  static async getTaskAttachments(req, res) {
    try {
      const { taskId } = req.params;

      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task ID'
        });
      }

      const attachmentsResult = await query(`
        SELECT 
          a.*,
          u.username as uploader_username,
          u.full_name as uploader_name
        FROM attachments a
        JOIN users u ON a.uploader_id = u.id
        WHERE a.task_id = $1
        ORDER BY a.created_at DESC
      `, [parseInt(taskId)]);

      const attachments = attachmentsResult.rows.map(attachment => ({
        ...attachment,
        url: `/api/attachments/${attachment.id}`,
        download_url: `/api/attachments/${attachment.id}/download`
      }));

      res.json({
        success: true,
        data: { attachments }
      });
    } catch (error) {
      console.error('Get task attachments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = AttachmentController;
