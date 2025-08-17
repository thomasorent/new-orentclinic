// Validation service
// Handles input validation, date validation, and utility functions

export class ValidationService {
  // Normalize phone number for comparison (remove country code, spaces, dashes, etc.)
  static normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');
    
    // If it starts with country code (e.g., 91 for India), remove it
    // For now, we'll assume local numbers are 10 digits
    if (normalized.length > 10) {
      normalized = normalized.slice(-10); // Take last 10 digits
    }
    
    return normalized;
  }

  // Calculate the maximum advance booking date (excluding weekends)
  static calculateMaxAdvanceDate(weekdaysAhead: number): Date {
    const today = new Date();
    let currentDate = new Date(today);
    let weekdaysCount = 0;
    
    // Start from tomorrow
    currentDate.setDate(currentDate.getDate() + 1);
    
    while (weekdaysCount < weekdaysAhead) {
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdaysCount++;
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Go back one day since we went one day too far
    currentDate.setDate(currentDate.getDate() - 1);
    
    // Reset time to start of day for consistent comparison
    currentDate.setHours(0, 0, 0, 0);
    
    return currentDate;
  }

  // Validate date format (dd/mm/yyyy)
  static validateDateFormat(dateInput: string): { isValid: boolean; day?: number; month?: number; year?: number } {
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateInput.match(dateRegex);
    
    if (!match) {
      return { isValid: false };
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // Month is 0-indexed
    const year = parseInt(match[3]);
    
    // Create date object to validate
    const date = new Date(year, month, day);
    
    // Check if the date is valid
    if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return { isValid: false };
    }

    return { isValid: true, day, month, year };
  }

  // Validate date is not in the past
  static validateDateNotInPast(date: Date): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day for date comparison
    return date >= now;
  }

  // Validate date is a weekday
  static validateWeekday(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday
  }

  // Validate date is within advance booking limit
  static validateAdvanceBookingLimit(date: Date, maxWeekdays: number): boolean {
    const maxAdvanceDate = this.calculateMaxAdvanceDate(maxWeekdays);
    return date <= maxAdvanceDate;
  }

  // Comprehensive date validation
  static validateAppointmentDate(dateInput: string): {
    isValid: boolean;
    error?: string;
    date?: Date;
    formattedDate?: string;
  } {
    // Validate format
    const formatValidation = this.validateDateFormat(dateInput);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        error: 'Invalid date format. Please use dd/mm/yyyy format (e.g., 25/12/2024).'
      };
    }

    // Create date object
    const { day, month, year } = formatValidation;
    const date = new Date(year!, month!, day!);

    // Validate not in past
    if (!this.validateDateNotInPast(date)) {
      return {
        isValid: false,
        error: 'Cannot book appointments in the past. Please choose a future date.'
      };
    }

    // Validate weekday
    if (!this.validateWeekday(date)) {
      return {
        isValid: false,
        error: 'Appointments are only available on weekdays (Monday to Friday). Please choose a different date.'
      };
    }

    // Validate advance booking limit
    if (!this.validateAdvanceBookingLimit(date, 7)) {
      const maxAdvanceDate = this.calculateMaxAdvanceDate(7);
      const maxDateFormatted = maxAdvanceDate.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
      return {
        isValid: false,
        error: `Cannot book appointments more than 7 weekdays in advance. The latest available date is ${maxDateFormatted}. Please choose an earlier date.`
      };
    }

    // Format date for database (convert to yyyy-mm-dd)
    const formattedDate = `${year!.toString().padStart(4, '0')}-${(month! + 1).toString().padStart(2, '0')}-${day!.toString().padStart(2, '0')}`;

    return {
      isValid: true,
      date,
      formattedDate
    };
  }

  // Test date conversion (for debugging)
  static testDateConversion(dateInput: string): string {
    const validation = this.validateAppointmentDate(dateInput);
    if (validation.isValid && validation.formattedDate) {
      return `✅ ${dateInput} -> ${validation.formattedDate}`;
    }
    return `❌ ${dateInput} -> Invalid date`;
  }
} 