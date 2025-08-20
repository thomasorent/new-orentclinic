-- Payment Schema Update for Orent Clinic
-- Add payment-related columns to support the new payment flow
-- Run this script after the initial setup-database.sql

-- Add payment-related columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'timeout')),
ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_amount INTEGER DEFAULT 5000, -- Amount in paisa (₹50.00)
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS booking_fee INTEGER DEFAULT 5000, -- ₹50 booking fee in paisa
ADD COLUMN IF NOT EXISTS payment_reservation_expires_at TIMESTAMP,
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
    AND payment_reservation_expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- Create a function to handle payment confirmation
CREATE OR REPLACE FUNCTION confirm_payment(
  p_payment_order_id VARCHAR(100),
  p_razorpay_payment_id VARCHAR(100),
  p_payment_method VARCHAR(50) DEFAULT 'razorpay'
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
      AND (payment_reservation_expires_at IS NULL OR payment_reservation_expires_at > CURRENT_TIMESTAMP)
  ) INTO appointment_exists;
  
  IF appointment_exists THEN
    -- Update payment status
    UPDATE appointments 
    SET payment_status = 'completed',
        razorpay_payment_id = p_razorpay_payment_id,
        payment_method = p_payment_method,
        payment_confirmed_at = CURRENT_TIMESTAMP,
        is_slot_confirmed = TRUE
    WHERE payment_order_id = p_payment_order_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ language 'plpgsql';

-- Add some sample data with payment information
INSERT INTO appointments (
  date, time_slot, patient_name, department, patient_phone, 
  payment_status, payment_order_id, payment_amount, booking_fee,
  payment_reservation_expires_at, is_slot_confirmed
) VALUES
(
  CURRENT_DATE + INTERVAL '1 day', '11:00:00', 'Test Patient', 'Ortho', '+919876543999',
  'completed', 'order_test_' || extract(epoch from now()), 5000, 5000,
  CURRENT_TIMESTAMP + INTERVAL '15 minutes', TRUE
)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
-- GRANT EXECUTE ON FUNCTION expire_payment_reservations() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION confirm_payment(VARCHAR, VARCHAR, VARCHAR) TO your_app_user; 