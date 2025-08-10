import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  try {
    // Note: In Supabase, tables are typically created through the dashboard or migrations
    // This function is kept for compatibility but will not create tables
    console.log('Database tables should be created through Supabase dashboard or migrations');
    
    // You can run this SQL in your Supabase SQL editor:
    /*
    CREATE TABLE IF NOT EXISTS appointments (
      id BIGSERIAL PRIMARY KEY,
      date DATE NOT NULL,
      time_slot TIME NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      department VARCHAR(50) NOT NULL CHECK (department IN ('Ortho', 'ENT')),
      patient_phone VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(patient_phone);
    CREATE INDEX IF NOT EXISTS idx_appointments_department ON appointments(department);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
    CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(time_slot);
    CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(date, time_slot);

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
    CREATE TRIGGER update_appointments_updated_at
      BEFORE UPDATE ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    */
    
    console.log('Database initialization note: Tables should be created through Supabase dashboard');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Close database connection (not needed for Supabase)
export async function closePool(): Promise<void> {
  // Supabase handles connection management automatically
  console.log('Supabase connection management is automatic');
} 