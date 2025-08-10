#!/usr/bin/env node

// Test database connection script
// Run with: node scripts/test-db-connection.js

require('dotenv').config();
const { pool, testConnection, initializeDatabase } = require('../src/config/database');

async function testDatabaseSetup() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test basic connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    console.log('✅ Database connection successful\n');

    // Initialize database (create tables)
    console.log('🔧 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully\n');

    // Test basic query
    console.log('📊 Testing basic query...');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM appointments');
      console.log(`✅ Query successful. Found ${result.rows[0].count} appointments`);
    } finally {
      client.release();
    }

    console.log('\n🎉 All database tests passed!');
    console.log('\nYour PostgreSQL database is ready to use.');

  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check if PostgreSQL is running');
    console.error('2. Verify your .env file has correct database credentials');
    console.error('3. Ensure the database "orent_clinic" exists');
    console.error('4. Check user permissions');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseSetup(); 