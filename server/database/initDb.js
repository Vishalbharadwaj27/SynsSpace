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

    console.log('Executing database schema SQL...');
    await connection.query(schemaSql);
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
