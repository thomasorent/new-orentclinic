-- Supabase Migration: Add Payment Support
-- This migration adds payment-related columns to the appointments table
-- Run this in your Supabase SQL editor

-- Add payment-related columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'timeout')),
ADD COLUMN IF NOT EXISTS payment_order_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_amount INTEGER DEFAULT 5000, -- Amount in paisa (₹50.00)
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS booking_fee INTEGER DEFAULT 5000, -- ₹50 booking fee in paisa
ADD COLUMN IF NOT EXISTS payment_reservation_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_slot_confirmed BOOLEAN DEFAULT FALSE;

-- Create indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_order_id ON appointments(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_appointments_razorpay_payment_id ON appointments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_expires ON appointments(payment_reservation_expires_at);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmed ON appointments(is_slot_confirmed);

-- Create a function to automatically expire payments
CREATE OR REPLACE FUNCTION expire_payment_reservations()
RETURNS void AS $$
BEGIN
  -- Update expired payment reservations to 'timeout' status
  UPDATE appointments 
  SET payment_status = 'timeout',
      is_slot_confirmed = FALSE
  WHERE payment_status = 'pending' 
    AND payment_reservation_expires_at IS NOT NULL 
    AND payment_reservation_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle payment confirmation
CREATE OR REPLACE FUNCTION confirm_payment(
  p_payment_order_id TEXT,
  p_razorpay_payment_id TEXT,
  p_payment_method TEXT DEFAULT 'razorpay'
)
RETURNS BOOLEAN AS $$
DECLARE
  appointment_exists BOOLEAN;
BEGIN
  -- Check if appointment exists and is still within payment window
  SELECT EXISTS(
    SELECT 1 FROM appointments 
    WHERE payment_order_id = p_payment_order_id 
      AND payment_status = 'pending'
      AND (payment_reservation_expires_at IS NULL OR payment_reservation_expires_at > NOW())
  ) INTO appointment_exists;
  
  IF appointment_exists THEN
    -- Update payment status
    UPDATE appointments 
    SET payment_status = 'completed',
        razorpay_payment_id = p_razorpay_payment_id,
        payment_method = p_payment_method,
        payment_confirmed_at = NOW(),
        is_slot_confirmed = TRUE
    WHERE payment_order_id = p_payment_order_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS) for the new columns if needed
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policy for reading appointments (adjust as needed)
-- CREATE POLICY "Users can view their own appointments" ON appointments
--   FOR SELECT USING (auth.jwt() ->> 'phone' = patient_phone);

-- Create policy for updating payment status (restrict to service accounts)
-- CREATE POLICY "Service can update payment status" ON appointments
--   FOR UPDATE USING (auth.jwt() ->> 'role' = 'service');

-- Add helpful comments
COMMENT ON COLUMN appointments.payment_status IS 'Current status of the payment for this appointment';
COMMENT ON COLUMN appointments.payment_order_id IS 'Unique identifier for the payment order';
COMMENT ON COLUMN appointments.payment_amount IS 'Payment amount in paisa (Indian currency)';
COMMENT ON COLUMN appointments.booking_fee IS 'Booking fee in paisa (currently ₹50)';
COMMENT ON COLUMN appointments.payment_reservation_expires_at IS 'When the payment reservation expires (15 minutes from creation)';
COMMENT ON COLUMN appointments.is_slot_confirmed IS 'Whether the slot is confirmed after successful payment';
COMMENT ON FUNCTION expire_payment_reservations() IS 'Function to automatically expire payment reservations after timeout';
COMMENT ON FUNCTION confirm_payment(TEXT, TEXT, TEXT) IS 'Function to confirm payment and finalize appointment booking'; 