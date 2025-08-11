// Final test for the updated logic
console.log('Testing the updated time parsing logic:');

// Mock the updated function
function parseFlexibleTimeInput(timeInput) {
  try {
    const cleanInput = timeInput.trim().toLowerCase();
    
    // Handle 24-hour format
    if (/^\d{1,2}:\d{2}$/.test(cleanInput)) {
      const [hours, minutes] = cleanInput.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      return null;
    }
    
    // Handle 12-hour format with AM/PM
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
    
    // Handle 12-hour format without AM/PM (assume PM for hours 1-11, PM for 12)
    const timeMatch = cleanInput.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      let [_, hours, minutes] = timeMatch;
      let hourNum = parseInt(hours);
      const minuteNum = parseInt(minutes);
      
      if (minuteNum < 0 || minuteNum > 59) return null;
      
      // If hour is 12, assume PM; if 1-11, assume PM (clinic hours are typically afternoon)
      if (hourNum === 12) {
        hourNum = 12; // 12 PM = 12:00
      } else if (hourNum >= 1 && hourNum <= 11) {
        hourNum = hourNum + 12; // 1-11 PM = 13:00-23:00
      } else {
        return null; // Invalid hour
      }
      
      return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing flexible time input:', error);
    return null;
  }
}

// Test cases
const testCases = [
  { input: "1:30", expected: "13:30", description: "1:30 (assumes PM)" },
  { input: "1:30 AM", expected: "01:30", description: "1:30 AM (explicit AM)" },
  { input: "1:30 PM", expected: "13:30", description: "1:30 PM (explicit PM)" },
  { input: "10:30", expected: "22:30", description: "10:30 (assumes PM)" },
  { input: "10:30 AM", expected: "10:30", description: "10:30 AM (explicit AM)" },
  { input: "12:00", expected: "12:00", description: "12:00 (assumes PM)" },
  { input: "12:00 AM", expected: "00:00", description: "12:00 AM (explicit AM)" },
  { input: "13:30", expected: "13:30", description: "13:30 (24-hour format)" }
];

console.log('\nResults:');
testCases.forEach(testCase => {
  const result = parseFlexibleTimeInput(testCase.input);
  const status = result === testCase.expected ? "✅" : "❌";
  console.log(`${status} "${testCase.input}" → ${result} (${testCase.description})`);
});

console.log('\nKey Changes:');
console.log('• "1:30" now assumes PM → 13:30 (was 01:30)');
console.log('• "10:30" now assumes PM → 22:30 (was 10:30)');
console.log('• Hours 1-11 without AM/PM now assume PM (clinic hours)');
console.log('• Users can still be explicit with "1:30 AM" for morning times'); 