require('dotenv').config();

const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  }
}

// Run only if file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
