/**
 * Utility functions for time format conversions
 */

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