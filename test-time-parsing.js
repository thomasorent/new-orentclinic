// Test script for time parsing function
// This simulates the parseFlexibleTimeInput function logic

function parseFlexibleTimeInput(timeInput) {
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
}

// Test cases
const testCases = [
  '1:30',
  '1:30 PM',
  '1:30pm',
  '10:30',
  '10:30 AM',
  '10:30am',
  '12:00',
  '12:00 PM',
  '13:30',
  '2:30',
  '2:30 PM',
  '11:45',
  '11:45 AM',
  '3:30',
  '9:30'
];

console.log('Testing time parsing function:');
console.log('==============================');

testCases.forEach(testCase => {
  const result = parseFlexibleTimeInput(testCase);
  console.log(`"${testCase}" → ${result || 'INVALID'}`);
});

console.log('\nExpected behavior:');
console.log('- "1:30" should return "13:30" (assumes PM)');
console.log('- "10:30" should return "10:30" (assumes AM)');
console.log('- "1:30 PM" should return "13:30" (explicit PM)');
console.log('- "10:30 AM" should return "10:30" (explicit AM)');
console.log('- "3:30" should return null (outside clinic hours)'); 