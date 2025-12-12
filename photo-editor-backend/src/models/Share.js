const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Share {
  static async create(albumId, userId, expiresInDays = null) {
    const shareToken = uuidv4();
    let expiresAt = null;
    
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const query = `
      INSERT INTO shares (album_id, share_token, created_by, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [albumId, shareToken, userId, expiresAt]);
    return result.rows[0];
  }

  static async findByToken(token) {
    const query = `
      SELECT s.*, a.name as album_name, a.description as album_description,
             u.name as shared_by_name
      FROM shares s
      INNER JOIN albums a ON s.album_id = a.id
      INNER JOIN users u ON s.created_by = u.id
      WHERE s.share_token = $1
      AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
    `;

    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async findByAlbumId(albumId) {
    const query = `
      SELECT * FROM shares
      WHERE album_id = $1
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;

    const result = await pool.query(query, [albumId]);
    return result.rows;
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM shares WHERE id = $1 AND created_by = $2 RETURNING *';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }
}

module.exports = Share;