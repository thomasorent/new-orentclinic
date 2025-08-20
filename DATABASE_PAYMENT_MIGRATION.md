# Database Migration: Payment Support

This document outlines the database schema changes required to support the new payment functionality in the Orent Clinic WhatsApp booking system.

## Overview

The payment flow introduces several new concepts:
- **15-minute slot reservations** before payment
- **Razorpay payment integration** with order tracking
- **Automatic payment timeout** handling
- **Payment status tracking** throughout the booking process

## Required Schema Changes

### New Columns Added to `appointments` Table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `payment_status` | VARCHAR(20) | 'pending' | Current payment status |
| `payment_order_id` | VARCHAR(100) | NULL | Unique payment order identifier |
| `payment_amount` | INTEGER | 5000 | Payment amount in paisa (₹50.00) |
| `payment_method` | VARCHAR(50) | NULL | Payment method used |
| `razorpay_payment_id` | VARCHAR(100) | NULL | Razorpay payment ID |
| `razorpay_order_id` | VARCHAR(100) | NULL | Razorpay order ID |
| `payment_confirmed_at` | TIMESTAMP | NULL | When payment was confirmed |
| `booking_fee` | INTEGER | 5000 | Booking fee in paisa |
| `payment_reservation_expires_at` | TIMESTAMP | NULL | 15-minute expiry time |
| `is_slot_confirmed` | BOOLEAN | FALSE | Whether slot is confirmed |

### Payment Status Values

- `pending` - Payment not yet initiated
- `processing` - Payment in progress
- `completed` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled by user
- `timeout` - Payment timed out (15 minutes expired)

## Migration Instructions

### For Supabase Users

1. **Run the migration script** in Supabase SQL Editor:
   ```bash
   # Copy and paste contents of scripts/supabase-payment-migration.sql
   ```

2. **Verify the migration**:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'appointments' 
   ORDER BY ordinal_position;
   ```

### For PostgreSQL Users

1. **Run the migration script**:
   ```bash
   psql -d orent_clinic -f scripts/payment-schema-update.sql
   ```

2. **Grant permissions** (adjust user as needed):
   ```sql
   GRANT EXECUTE ON FUNCTION expire_payment_reservations() TO your_app_user;
   GRANT EXECUTE ON FUNCTION confirm_payment(VARCHAR, VARCHAR, VARCHAR) TO your_app_user;
   ```

## New Database Functions

### `expire_payment_reservations()`

Automatically expires payment reservations after timeout:
```sql
-- Call this function periodically (e.g., via cron job)
SELECT expire_payment_reservations();
```

### `confirm_payment(order_id, payment_id, method)`

Confirms a payment and finalizes the booking:
```sql
-- Example usage
SELECT confirm_payment('order_123', 'pay_456', 'razorpay');
```

## Application Code Changes Required

### Update AppointmentService

The `appointmentService.ts` will need updates to:
1. **Handle payment fields** in CRUD operations
2. **Map new database columns** to TypeScript interfaces
3. **Support payment confirmation** workflow

Example mapping update needed:
```typescript
// In appointmentService.ts - readAppointments() method
return (data || []).map(row => ({
  id: row.id,
  date: row.date,
  timeSlot: row.time_slot,
  patientName: row.patient_name,
  department: row.department,
  patientPhone: row.patient_phone,
  paymentStatus: row.payment_status,
  paymentOrderId: row.payment_order_id,
  paymentAmount: row.payment_amount,
  paymentMethod: row.payment_method,
  razorpayPaymentId: row.razorpay_payment_id,
  razorpayOrderId: row.razorpay_order_id,
  paymentConfirmedAt: row.payment_confirmed_at,
  bookingFee: row.booking_fee,
  paymentReservationExpiresAt: row.payment_reservation_expires_at,
  isSlotConfirmed: row.is_slot_confirmed,
  createdAt: row.created_at,
  updatedAt: row.updated_at
}));
```

## Testing the Migration

### 1. Verify Column Addition
```sql
-- Check that all new columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name LIKE '%payment%' OR column_name = 'is_slot_confirmed';
```

### 2. Test Payment Functions
```sql
-- Test payment confirmation function
INSERT INTO appointments (date, time_slot, patient_name, department, patient_phone, payment_order_id)
VALUES ('2024-12-25', '10:30:00', 'Test User', 'Ortho', '+919999999999', 'test_order_123');

-- Confirm the payment
SELECT confirm_payment('test_order_123', 'test_payment_456', 'razorpay');

-- Verify the update
SELECT payment_status, is_slot_confirmed, payment_confirmed_at 
FROM appointments WHERE payment_order_id = 'test_order_123';
```

### 3. Test Expiration Function
```sql
-- Create an expired reservation
INSERT INTO appointments (
  date, time_slot, patient_name, department, patient_phone, 
  payment_order_id, payment_reservation_expires_at
) VALUES (
  '2024-12-25', '11:30:00', 'Expired User', 'ENT', '+919999999998',
  'expired_order_123', NOW() - INTERVAL '1 hour'
);

-- Run expiration function
SELECT expire_payment_reservations();

-- Verify expiration
SELECT payment_status FROM appointments WHERE payment_order_id = 'expired_order_123';
-- Should return 'timeout'
```

## Rollback Instructions

If you need to rollback the migration:

```sql
-- Remove added columns (WARNING: This will delete data)
ALTER TABLE appointments 
DROP COLUMN IF EXISTS payment_status,
DROP COLUMN IF EXISTS payment_order_id,
DROP COLUMN IF EXISTS payment_amount,
DROP COLUMN IF EXISTS payment_method,
DROP COLUMN IF EXISTS razorpay_payment_id,
DROP COLUMN IF EXISTS razorpay_order_id,
DROP COLUMN IF EXISTS payment_confirmed_at,
DROP COLUMN IF EXISTS booking_fee,
DROP COLUMN IF EXISTS payment_reservation_expires_at,
DROP COLUMN IF EXISTS is_slot_confirmed;

-- Drop functions
DROP FUNCTION IF EXISTS expire_payment_reservations();
DROP FUNCTION IF EXISTS confirm_payment(VARCHAR, VARCHAR, VARCHAR);
```

## Next Steps

After running the migration:

1. **Update AppointmentService** to handle new fields
2. **Implement Razorpay webhook handler** for payment confirmations
3. **Set up cron job** to call `expire_payment_reservations()` every minute
4. **Test payment flow** end-to-end
5. **Monitor payment status** and handle edge cases

## Support

If you encounter issues with the migration:
1. Check database logs for errors
2. Verify user permissions
3. Ensure all required columns were added
4. Test functions independently

## Security Considerations

- **Payment order IDs** should be unique and unpredictable
- **Webhook validation** is crucial for Razorpay integration
- **Rate limiting** should be applied to payment endpoints
- **Audit logging** for all payment status changes 