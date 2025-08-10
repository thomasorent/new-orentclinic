-- Database setup script for Orent Clinic
-- Run this script in your PostgreSQL database

-- Create database (run this as superuser)
-- CREATE DATABASE orent_clinic;

-- Connect to the database and run the following:

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  department VARCHAR(50) NOT NULL CHECK (department IN ('Ortho', 'ENT')),
  patient_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_department ON appointments(department);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(time_slot);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(date, time_slot);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO appointments (date, time_slot, patient_name, department, patient_phone) VALUES
  ('2024-12-20', '10:00:00', 'John Doe', 'Ortho', '+919876543210'),
  ('2024-12-21', '14:30:00', 'Jane Smith', 'ENT', '+919876543211')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE appointments TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE appointments_id_seq TO your_app_user; 