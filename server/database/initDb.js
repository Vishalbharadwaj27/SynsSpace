const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables from server/.env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  // Connection configuration without specifying database name first
  // to ensure connection succeeds even if the database doesn't exist yet
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    multipleStatements: true
  };

  console.log(`Connecting to database host: ${config.host}:${config.port} as user: ${config.user}`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL server successfully.');

    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    console.log('Reading schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Dropping all existing tables...');
    await connection.query('USE syncspace');
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'syncspace'"
    );
    if (tables.length > 0) {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const table of tables) {
        await connection.query(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
        console.log(`  Dropped table: ${table.TABLE_NAME}`);
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('All existing tables dropped.');
    } else {
      console.log('No existing tables to drop.');
    }

    console.log('Executing database schema SQL...');
    await connection.query(schemaSql);

    try {
      await connection.query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) DEFAULT NULL');
    } catch (e) {
      // Column may already exist
    }
    try {
      await connection.query('ALTER TABLE users ADD COLUMN reset_token_expires DATETIME DEFAULT NULL');
    } catch (e) {
      // Column may already exist
    }
    try {
      await connection.query("ALTER TABLE files ADD COLUMN sharing_permission ENUM('view', 'download') DEFAULT 'view'");
    } catch (e) {
      // Column may already exist
    }

    console.log('Database and tables created successfully!');
    
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

initializeDatabase();
