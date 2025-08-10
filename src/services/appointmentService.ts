import { supabase } from '../config/database';
import type { Appointment, CreateAppointmentRequest } from '../types/appointment';

// Available time slots (weekdays only)
export const AVAILABLE_TIME_SLOTS = [
  '10:30', '10:45', '11:15', '11:30', '12:00', 
  '12:15', '12:30', '1:00', '1:30', '1:45'
];

// Weekday names for validation
export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export class AppointmentService {
  // Read appointments from database
  static async readAppointments(): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('time_slot', { ascending: true });
      
      if (error) {
        console.error('Error reading appointments from database:', error);
        return [];
      }
      
      // Map snake_case to camelCase
      return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        timeSlot: row.time_slot,
        patientName: row.patient_name,
        department: row.department,
        patientPhone: row.patient_phone,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error reading appointments from database:', error);
      return [];
    }
  }

  // Validate if date and time are valid for booking
  static isValidAppointmentDateTime(dateStr: string, timeStr: string): { isValid: boolean; error?: string } {
    try {
      const date = new Date(dateStr);
      
      // Check if it's a valid date
      if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
      }
      
      // Check if it's a weekday (0 = Sunday, 6 = Saturday)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { isValid: false, error: 'Appointments are only available on weekdays (Monday to Friday)' };
      }
      
      // Check if it's in the future
      const now = new Date();
      if (date < now) {
        return { isValid: false, error: 'Cannot book appointments in the past' };
      }
      
      // Check if time is in available slots
      if (!AVAILABLE_TIME_SLOTS.includes(timeStr)) {
        return { isValid: false, error: `Invalid time slot. Available slots are: ${AVAILABLE_TIME_SLOTS.join(', ')}` };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid date/time format' };
    }
  }

  // Check available time slots for a specific date
  static async getAvailableSlotsForDate(dateStr: string): Promise<{ available: string[], booked: string[], error?: string }> {
    try {
      // Validate the date format and check if it's a weekday
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return { available: [], booked: [], error: 'Invalid date format' };
      }
      
      // Check if it's a weekday
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { available: [], booked: [], error: 'Appointments are only available on weekdays (Monday to Friday)' };
      }
      
      // Check if it's in the future
      const now = new Date();
      if (date < now) {
        return { available: [], booked: [], error: 'Cannot check availability for past dates' };
      }

      // Get all appointments for this date
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('time_slot')
        .eq('date', dateStr);

      if (error) {
        console.error('Error fetching appointments for date:', error);
        return { available: [], booked: [], error: 'Database error while checking availability' };
      }

      // Get booked time slots
      const bookedSlots = appointments?.map(apt => apt.time_slot) || [];
      
      // Normalize booked slots to remove seconds (e.g., "10:30:00" -> "10:30")
      const normalizedBookedSlots = bookedSlots.map(slot => {
        // Remove seconds if present (e.g., "10:30:00" -> "10:30")
        return slot.split(':').slice(0, 2).join(':');
      });
      
      // Debug logging
      console.log(`getAvailableSlotsForDate for ${dateStr}:`);
      console.log(`  Raw appointments from DB:`, appointments);
      console.log(`  Raw booked slots: ${bookedSlots.join(', ')}`);
      console.log(`  Normalized booked slots: ${normalizedBookedSlots.join(', ')}`);
      console.log(`  All available slots: ${AVAILABLE_TIME_SLOTS.join(', ')}`);
      console.log(`  Input date: ${dateStr}, Type: ${typeof dateStr}`);
      console.log(`  SQL Query: SELECT time_slot FROM appointments WHERE date = '${dateStr}'`);
      
      // Find available slots (all slots minus booked ones)
      const availableSlots = AVAILABLE_TIME_SLOTS.filter(slot => !normalizedBookedSlots.includes(slot));
      
      console.log(`  Final available slots: ${availableSlots.join(', ')}`);

      return {
        available: availableSlots,
        booked: normalizedBookedSlots
      };

    } catch (error) {
      console.error('Error checking available slots for date:', error);
      return { available: [], booked: [], error: 'Error processing date' };
    }
  }

  // Create new appointment
  static async createAppointment(appointment: CreateAppointmentRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // First, check if the slot is still available (double-check to prevent race conditions)
      const availability = await this.getAvailableSlotsForDate(appointment.date);
      if (!availability.available.includes(appointment.timeSlot)) {
        return { 
          success: false, 
          error: `Time slot ${appointment.timeSlot} is no longer available for ${appointment.date}` 
        };
      }

      // Map camelCase to snake_case for database
      const dbAppointment = {
        date: appointment.date,
        time_slot: appointment.timeSlot,
        patient_name: appointment.patientName,
        department: appointment.department,
        patient_phone: appointment.patientPhone
      };

      // Debug: Log what's being stored
      console.log(`Creating appointment with date: ${appointment.date} (type: ${typeof appointment.date})`);
      console.log(`Creating appointment with time: ${appointment.timeSlot} (type: ${typeof appointment.timeSlot})`);
      console.log(`Database appointment object:`, dbAppointment);

      const { error } = await supabase
        .from('appointments')
        .insert([dbAppointment])
        .select();

      if (error) {
        console.error('Error creating appointment:', error);
        
        // Handle specific database errors
        if (error.code === '23505') { // Unique constraint violation
          return { 
            success: false, 
            error: `Time slot ${appointment.timeSlot} is no longer available for ${appointment.date} (already booked by another user)` 
          };
        }
        
        return { success: false, error: 'Database error while creating appointment' };
      }

      // Debug: Log what was actually stored
      console.log(`Appointment created successfully. Time slot stored as: ${appointment.timeSlot}`);

      return { success: true };
    } catch (error) {
      console.error('Error creating appointment:', error);
      return { success: false, error: 'Unexpected error while creating appointment' };
    }
  }

  // Update existing appointment
  static async updateAppointment(id: string, updates: Partial<CreateAppointmentRequest>): Promise<{ success: boolean; error?: string }> {
    try {
      // Map camelCase to snake_case for database
      const dbUpdates: any = {};
      if (updates.date) dbUpdates.date = updates.date;
      if (updates.timeSlot) dbUpdates.time_slot = updates.timeSlot;
      if (updates.patientName) dbUpdates.patient_name = updates.patientName;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.patientPhone) dbUpdates.patient_phone = updates.patientPhone;

      const { error } = await supabase
        .from('appointments')
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating appointment:', error);
        return { success: false, error: 'Database error while updating appointment' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { success: false, error: 'Unexpected error while updating appointment' };
    }
  }

  // Delete appointment
  static async deleteAppointment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting appointment:', error);
        return { success: false, error: 'Database error while deleting appointment' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return { success: false, error: 'Unexpected error while deleting appointment' };
    }
  }

  // Get appointments with filters
  static async getAppointments(filters: Record<string, string> = {}): Promise<Appointment[]> {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      // Apply filters
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.date) {
        query = query.eq('date', filters.date);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error reading appointments from database:', error);
        return [];
      }
      
      // Map snake_case to camelCase
      return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        timeSlot: row.time_slot,
        patientName: row.patient_name,
        department: row.department,
        patientPhone: row.patient_phone,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error reading appointments from database:', error);
      return [];
    }
  }

  // Debug method to check all appointments
  static async debugAllAppointments(): Promise<void> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching all appointments:', error);
        return;
      }

      console.log('=== DEBUG: All appointments in database ===');
      console.log('Total appointments:', appointments?.length || 0);
      appointments?.forEach((apt, index) => {
        console.log(`${index + 1}. Date: ${apt.date}, Time: ${apt.time_slot}, Patient: ${apt.patient_name}, Phone: ${apt.patient_phone}`);
      });
      console.log('=== End debug ===');
    } catch (error) {
      console.error('Error in debugAllAppointments:', error);
    }
  }

  // Debug method to test database connection and table structure
  static async debugDatabaseConnection(): Promise<void> {
    try {
      console.log('=== DEBUG: Testing database connection ===');
      
      // Test basic connection
      const { error } = await supabase
        .from('appointments')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Database connection error:', error);
        return;
      }
      
      console.log('Database connection successful');
      
      // Test table structure
      const { error: structureError } = await supabase
        .from('appointments')
        .select('*')
        .limit(0);
      
      if (structureError) {
        console.error('Table structure error:', structureError);
        return;
      }
      
      console.log('Table structure check successful');
      console.log('=== End database connection test ===');
      
    } catch (error) {
      console.error('Error in debugDatabaseConnection:', error);
    }
  }

  // Debug method to check database schema
  static async debugDatabaseSchema(): Promise<void> {
    try {
      console.log('=== DEBUG: Database Schema Check ===');
      
      // Try to get column information by selecting one row
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Error fetching schema info:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const row = data[0];
        console.log('Sample row structure:');
        Object.keys(row).forEach(key => {
          const value = row[key];
          console.log(`  ${key}: ${value} (type: ${typeof value})`);
        });
      }
      
      console.log('=== End schema check ===');
      
    } catch (error) {
      console.error('Error in debugDatabaseSchema:', error);
    }
  }
} 