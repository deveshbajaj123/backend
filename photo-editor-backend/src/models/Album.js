const pool = require('../config/database');

class Album {
  static async create(userId, name, description = null) {
    const query = `
      INSERT INTO albums (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, name, description]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = `
      SELECT a.*, COUNT(ap.photo_id) as photo_count
      FROM albums a
      LEFT JOIN album_photos ap ON a.id = ap.album_id
      WHERE a.user_id = $1
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM albums WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, userId, name, description) {
    const query = `
      UPDATE albums
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, description, id, userId]);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM albums WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async addPhoto(albumId, photoId) {
    const query = `
      INSERT INTO album_photos (album_id, photo_id)
      VALUES ($1, $2)
      ON CONFLICT (album_id, photo_id) DO NOTHING
      RETURNING *
    `;
    
    const result = await pool.query(query, [albumId, photoId]);
    return result.rows[0];
  }

  static async removePhoto(albumId, photoId) {
    const query = 'DELETE FROM album_photos WHERE album_id = $1 AND photo_id = $2';
    await pool.query(query, [albumId, photoId]);
  }

  static async getPhotos(albumId) {
    const query = `
      SELECT p.*, ap.added_at
      FROM photos p
      INNER JOIN album_photos ap ON p.id = ap.photo_id
      WHERE ap.album_id = $1
      ORDER BY ap.added_at DESC
    `;
    
    const result = await pool.query(query, [albumId]);
    return result.rows;
  }

  static async count(userId) {
    const query = 'SELECT COUNT(*) FROM albums WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Album;