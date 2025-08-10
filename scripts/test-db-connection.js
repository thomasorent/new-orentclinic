#!/usr/bin/env node

// Test database connection script
// Run with: node scripts/test-db-connection.js

require('dotenv').config();
const { supabase, testConnection, initializeDatabase } = require('../src/config/database');

async function testDatabaseSetup() {
  console.log('🔍 Testing Supabase database connection...\n');

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
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Query failed:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Query successful. Database is accessible`);

    console.log('\n🎉 All database tests passed!');
    console.log('\nYour Supabase database is ready to use.');

  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check if your .env file has correct Supabase credentials');
    console.error('2. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    console.error('3. Ensure your Supabase project is active');
    console.error('4. Check if the appointments table exists in your Supabase database');
    process.exit(1);
  }
}

// Run the test
testDatabaseSetup(); 