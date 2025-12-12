const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create user with email/password
  static async create({ email, password, name }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, created_at
    `;
    
    const result = await pool.query(query, [email, hashedPassword, name || email.split('@')[0]]);
    return result.rows[0];
  }

  // Create or find user from Google OAuth
  static async findOrCreateFromGoogle({ googleId, email, name, avatarUrl }) {
    // Check if user exists with this Google ID
    let query = 'SELECT * FROM users WHERE google_id = $1';
    let result = await pool.query(query, [googleId]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // Check if user exists with this email
    query = 'SELECT * FROM users WHERE email = $1';
    result = await pool.query(query, [email]);
    
    if (result.rows.length > 0) {
      // Link Google account to existing user
      query = `
        UPDATE users 
        SET google_id = $1, avatar_url = $2, name = $3
        WHERE email = $4
        RETURNING *
      `;
      result = await pool.query(query, [googleId, avatarUrl, name, email]);
      return result.rows[0];
    }
    
    // Create new user
    query = `
      INSERT INTO users (email, google_id, name, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    result = await pool.query(query, [email, googleId, name, avatarUrl]);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;