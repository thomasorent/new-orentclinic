/**
 * Utility functions for time format conversions
 */

/**
 * Parses flexible time input and converts to 24-hour format
 * Accepts formats like: "10:30", "10:30 AM", "1:30 PM", "13:30", "1:30", "10:30am", "1:30pm"
 * @param timeInput - Time string in various formats
 * @returns Time in 24-hour format (e.g., "10:30", "13:30") or null if invalid
 * 
 * Examples:
 * - "10:30" → "10:30" (assumes AM for clinic hours)
 * - "10:30 AM" → "10:30"
 * - "10:30am" → "10:30"
 * - "1:30 PM" → "13:30"
 * - "1:30pm" → "13:30"
 * - "1:30" → "13:30" (assumes PM for afternoon hours)
 * - "13:30" → "13:30" (24-hour format)
 * - "12:00" → "12:00" (assumes PM)
 * - "12:00 AM" → "00:00"
 * - "12:00 PM" → "12:00"
 */
export const parseFlexibleTimeInput = (timeInput: string): string | null => {
  try {
    const cleanInput = timeInput.trim().toLowerCase();
    
    // Handle 24-hour format (e.g., "13:30", "10:30")
    if (/^\d{1,2}:\d{2}$/.test(cleanInput)) {
      const [hours, minutes] = cleanInput.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      return null;
    }
    
    // Handle 12-hour format with AM/PM (e.g., "10:30 am", "1:30 pm", "10:30am", "1:30pm")
    const amPmMatch = cleanInput.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
    if (amPmMatch) {
      let [_, hours, minutes, period] = amPmMatch;
      let hourNum = parseInt(hours);
      const minuteNum = parseInt(minutes);
      
      if (minuteNum < 0 || minuteNum > 59) return null;
      
      if (period === 'pm') {
        if (hourNum !== 12) hourNum += 12;
      } else if (period === 'am') {
        if (hourNum === 12) hourNum = 0;
      }
      
      if (hourNum >= 0 && hourNum <= 23) {
        return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
      }
      return null;
    }
    
    // Handle 12-hour format without AM/PM (smart parsing for clinic hours)
    const timeMatch = cleanInput.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      let [_, hours, minutes] = timeMatch;
      let hourNum = parseInt(hours);
      const minuteNum = parseInt(minutes);
      
      if (minuteNum < 0 || minuteNum > 59) return null;
      
      // Smart parsing for clinic hours (10 AM - 2 PM)
      // If hour is 10 or 11, assume AM (morning clinic hours)
      // If hour is 1 or 2, assume PM (afternoon clinic hours)
      // If hour is 12, assume PM (noon)
      if (hourNum === 10 || hourNum === 11) {
        // Morning hours: 10:00-11:59 AM
        return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
      } else if (hourNum === 1 || hourNum === 2) {
        // Afternoon hours: 1:00-2:59 PM
        hourNum = hourNum + 12; // Convert to 24-hour: 1 PM = 13:00, 2 PM = 14:00
        return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
      } else if (hourNum === 12) {
        // Noon: 12:00 PM
        return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
      } else {
        // Invalid hour for clinic hours
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing flexible time input:', error);
    return null;
  }
};

/**
 * Converts 24-hour time format to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "10:30", "13:45")
 * @returns Time in 12-hour format with AM/PM (e.g., "10:30 AM", "1:45 PM")
 */
export const formatTimeTo12Hour = (time24: string): string => {
  try {
    // Parse the time string (e.g., "10:30" or "13:45")
    const [hours, minutes] = time24.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return time24; // Return original if parsing fails
    }
    
    // Create a Date object to use toLocaleTimeString
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Format to 12-hour with AM/PM
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return time24; // Return original if any error occurs
  }
};

/**
 * Converts 24-hour time format to 12-hour format with AM/PM for multiple time slots
 * @param timeSlots - Array of times in 24-hour format
 * @returns Array of times in 12-hour format with AM/PM
 */
export const formatTimeSlotsTo12Hour = (timeSlots: string[]): string[] => {
  return timeSlots.map(formatTimeTo12Hour);
};

/**
 * Formats a date and time slot combination for display
 * @param date - Date string
 * @param timeSlot - Time slot in 24-hour format
 * @returns Formatted date and time string
 */
export const formatDateTimeForDisplay = (date: string, timeSlot: string): string => {
  try {
    const dateObj = new Date(date);
    const formattedTime = formatTimeTo12Hour(timeSlot);
    
    return `${dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })} at ${formattedTime}`;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return `${date} at ${timeSlot}`;
  }
}; 