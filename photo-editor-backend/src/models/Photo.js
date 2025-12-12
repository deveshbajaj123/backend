const pool = require('../config/database');

class Photo {
  static async create(photoData) {
    const query = `
      INSERT INTO photos (user_id, filename, original_url, thumbnail_url, file_size, mime_type, width, height)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      photoData.userId,
      photoData.filename,
      photoData.originalUrl,
      photoData.thumbnailUrl,
      photoData.fileSize,
      photoData.mimeType,
      photoData.width,
      photoData.height,
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM photos
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM photos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM photos WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async search(userId, searchTerm) {
    const query = `
      SELECT * FROM photos
      WHERE user_id = $1 AND filename ILIKE $2
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId, `%${searchTerm}%`]);
    return result.rows;
  }

  static async count(userId) {
    const query = 'SELECT COUNT(*) FROM photos WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Photo;