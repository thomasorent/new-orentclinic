-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor

-- Create appointments table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_department ON appointments(department);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(time_slot);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(date, time_slot);

-- Create function to update updated_at timestamp
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

-- Enable Row Level Security (RLS) - optional but recommended for production
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can customize this based on your needs)
CREATE POLICY "Allow all operations on appointments" ON appointments
  FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample data (optional)
INSERT INTO appointments (date, time_slot, patient_name, department, patient_phone) VALUES
  ('2024-01-15', '09:00:00', 'John Doe', 'Ortho', '+1234567890'),
  ('2024-01-15', '10:00:00', 'Jane Smith', 'ENT', '+1234567891'),
  ('2024-01-16', '14:00:00', 'Bob Johnson', 'Ortho', '+1234567892')
ON CONFLICT DO NOTHING; 