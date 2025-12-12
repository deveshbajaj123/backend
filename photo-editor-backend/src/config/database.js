require('dotenv').config();
const { Pool } = require('pg');

// 🔍 DEBUG LOG — ADD THESE 3 LINES
console.log("🔍 DB_HOST =", process.env.DB_HOST);
console.log("🔍 DB_USER =", process.env.DB_USER);
console.log("🔍 DB_NAME =", process.env.DB_NAME);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.connect()
  .then(() => console.log("✅ Connected to Azure PostgreSQL"))
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  });

module.exports = pool;
