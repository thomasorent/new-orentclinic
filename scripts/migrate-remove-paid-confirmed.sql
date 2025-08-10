-- Migration script to remove paid and confirmed columns from appointments table
-- Run this script if you have an existing database with these columns

-- Connect to your existing database and run the following:

-- Remove the status index first (if it exists)
DROP INDEX IF EXISTS idx_appointments_status;

-- Remove the paid and confirmed columns
ALTER TABLE appointments DROP COLUMN IF EXISTS paid;
ALTER TABLE appointments DROP COLUMN IF EXISTS confirmed;

-- Verify the table structure
\d appointments;

-- Note: This migration will permanently remove the paid and confirmed data
-- Make sure to backup your data before running this script if needed 