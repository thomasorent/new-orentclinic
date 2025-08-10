import { WhatsAppService } from './whatsappService';
import { AppointmentService, AVAILABLE_TIME_SLOTS } from './appointmentService';
import type { CreateAppointmentRequest } from '../types/appointment';

// User booking state tracking
export interface UserBookingState {
  step: 'idle' | 'waiting_for_date' | 'waiting_for_slot' | 'waiting_for_details';
  selectedDate?: string;
  selectedSlot?: string;
  tempData?: {
    patientName?: string;
    phoneNumber?: string;
    department?: string;
  };
  reservationTime?: number; // Track when slot was reserved
}

// In-memory storage for user states (in production, consider using a database)
const userStates = new Map<string, UserBookingState>();

// Temporary reservations to prevent race conditions during booking process
// In production, this should be in a database with TTL
const temporaryReservations = new Map<string, { userId: string; timestamp: number }>();

// Reservation timeout (5 minutes)
const RESERVATION_TIMEOUT = 5 * 60 * 1000;

// Clean up expired reservations
setInterval(() => {
  const now = Date.now();
  for (const [key, reservation] of temporaryReservations.entries()) {
    if (now - reservation.timestamp > RESERVATION_TIMEOUT) {
      temporaryReservations.delete(key);
    }
  }
  
  // Also clean up expired user states (30 minutes timeout)
  for (const [userPhone, userState] of userStates.entries()) {
    if (userState.reservationTime && (now - userState.reservationTime > 30 * 60 * 1000)) {
      // Clear expired reservation
      if (userState.selectedDate && userState.selectedSlot) {
        const reservationKey = `${userState.selectedDate}-${userState.selectedSlot}`;
        temporaryReservations.delete(reservationKey);
      }
      userStates.delete(userPhone);
    }
  }
}, 60000); // Check every minute

export class MessageHandlerService {
  // Handle incoming WhatsApp messages
  static async handleIncomingMessage(message: {
    from: string;
    text?: { body: string };
    type: string;
  }): Promise<void> {
    const userPhone = message.from;
    const messageText = message.text?.body?.toLowerCase() || '';

    // Get or create user state
    const userState = userStates.get(userPhone) || { step: 'idle' };

    if (messageText.includes('book')) {
      // Start booking flow
      userState.step = 'waiting_for_date';
      userStates.set(userPhone, userState);
      await this.askForDate(userPhone);
    } else if (messageText.includes('my appointments') || messageText.includes('check')) {
      await this.sendUserAppointments(userPhone);
    } else if (messageText.includes('help')) {
      await this.sendHelpMessage(userPhone);
    } else if (messageText.includes('weekly') || messageText.includes('week')) {
      await this.sendWeeklyAvailability(userPhone);
    } else if (messageText.includes('cancel') || messageText.includes('stop')) {
      // Cancel booking flow
      const userState = userStates.get(userPhone);
      if (userState && userState.selectedDate && userState.selectedSlot) {
        // Clear the temporary reservation
        const reservationKey = `${userState.selectedDate}-${userState.selectedSlot}`;
        temporaryReservations.delete(reservationKey);
      }
      userStates.delete(userPhone);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Booking cancelled. You can start over by typing "book".')
      );
    } else if (userState.step === 'waiting_for_date') {
      // User provided a date
      await this.handleDateSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_slot') {
      // User provided a time slot as text
      await this.handleSlotSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_details') {
      // User providing patient details
      await this.handlePatientDetails(userPhone, messageText, userState);
    } else {
      await this.sendWelcomeMessage(userPhone);
    }
  }

  // Step 1: Ask user for date
  private static async askForDate(recipientPhone: string): Promise<void> {
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      '📅 Let\'s book your appointment!\n\nPlease provide the date you\'d like to book in dd/mm/yyyy format (e.g., 25/12/2024).\n\nNote: Appointments are only available on weekdays (Monday to Friday).\n\nType "cancel" to stop the booking process.'
    );
    await WhatsAppService.sendMessage(message);
  }

  // Step 2: Handle date selection and show available slots
  private static async handleDateSelection(userPhone: string, dateInput: string, userState: UserBookingState): Promise<void> {
    try {
      // Validate date format - only accept dd/mm/yyyy
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = dateInput.match(dateRegex);
      
      if (!match) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Invalid date format. Please use dd/mm/yyyy format (e.g., 25/12/2024).')
        );
        return;
      }

      // Parse date components
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; // Month is 0-indexed
      const year = parseInt(match[3]);
      
      // Create date object
      const date = new Date(year, month, day);
      
      // Validate the date
      if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Invalid date. Please provide a valid date in dd/mm/yyyy format (e.g., 25/12/2024).')
        );
        return;
      }

      // Check if it's a weekday (0 = Sunday, 6 = Saturday)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Appointments are only available on weekdays (Monday to Friday). Please choose a different date.')
        );
        return;
      }

      // Check if it's in the future
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset time to start of day for date comparison
      if (date < now) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Cannot book appointments in the past. Please choose a future date.')
        );
        return;
      }

      // Format date for database (convert to yyyy-mm-dd)
      // Use manual formatting to avoid timezone issues with toISOString()
      const formattedDate = `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Debug: Log the date conversion
      console.log(`Date conversion: ${dateInput} (dd/mm/yyyy) -> ${formattedDate} (yyyy-mm-dd)`);
      
      // Test the conversion
      const testConversion = this.testDateConversion(dateInput);
      console.log(`Test conversion result: ${testConversion}`);
      
      // Get available slots for this date considering both database and temporary reservations
      const availability = await this.getAvailableSlotsWithReservations(formattedDate);
      
      // Debug logging
      console.log(`Date: ${formattedDate}, Available: ${availability.available.join(', ')}, Booked: ${availability.booked.join(', ')}, Reserved: ${availability.reserved.join(', ')}`);
      
      // Debug: Check database schema to understand time format
      await AppointmentService.debugDatabaseSchema();
      
      if (availability.error) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ ${availability.error}\n\nPlease try a different date.`)
        );
        return;
      }
      
      if (availability.available.length === 0) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `📅 ${dateInput}\n\n❌ No available slots for this date.\n\nAll time slots are booked. Please choose a different date or type "cancel" to stop.`)
        );
        return;
      }

      // Update user state and show available slots as buttons
      userState.selectedDate = formattedDate; // Store formatted date for database
      userState.step = 'waiting_for_slot';
      userStates.set(userPhone, userState);

      await this.showAvailableSlotsAsText(userPhone, dateInput, availability.available);

    } catch (error) {
      console.error('Error handling date selection:', error);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Sorry, there was an error processing your date. Please try again or type "cancel" to start over.')
      );
    }
  }

  // Show available slots as text (instead of buttons)
  private static async showAvailableSlotsAsText(recipientPhone: string, date: string, availableSlots: string[]): Promise<void> {
    const slotsText = availableSlots.join(', ');
    
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `📅 Available slots for ${date}:\n\n⏰ ${slotsText}\n\nPlease type your preferred time slot (e.g., "10:30" or "1:00"):`
    );

    await WhatsAppService.sendMessage(message);
  }

  // Step 3: Handle slot selection (now handles text input instead of button clicks)
  private static async handleSlotSelection(userPhone: string, slotInput: string, userState: UserBookingState): Promise<void> {
    try {
      // Clean the input - remove any extra spaces and convert to lowercase for comparison
      const slot = slotInput.trim();
      
      if (!AVAILABLE_TIME_SLOTS.includes(slot)) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Invalid time slot: "${slot}".\n\nPlease type one of the available slots exactly as shown: ${AVAILABLE_TIME_SLOTS.join(', ')}`)
        );
        return;
      }

      // Check if slot is already reserved by another user
      const reservationKey = `${userState.selectedDate}-${slot}`;
      const existingReservation = temporaryReservations.get(reservationKey);
      
      if (existingReservation && existingReservation.userId !== userPhone) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Sorry, the slot ${slot} was just booked by another user. Please choose a different time slot.`)
        );
        return;
      }

      // Reserve this slot for this user
      temporaryReservations.set(reservationKey, { userId: userPhone, timestamp: Date.now() });
      
      // Update user state
      userState.selectedSlot = slot;
      userState.step = 'waiting_for_details';
      userState.reservationTime = Date.now();
      userStates.set(userPhone, userState);

      // Ask for patient details
      await this.askForPatientDetails(userPhone, userState.selectedDate!, slot);

    } catch (error) {
      console.error('Error handling slot selection:', error);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Sorry, there was an error processing your slot selection. Please try again or type "cancel" to start over.')
      );
    }
  }

  // Ask for patient details
  private static async askForPatientDetails(recipientPhone: string, date: string, time: string): Promise<void> {
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `📋 Great! You've selected ${date} at ${time}.\n\nNow please provide:\n\n1️⃣ Patient Name:\n2️⃣ Department (Ortho/ENT):\n3️⃣ Phone Number:\n\nYou can reply in two formats:\n\n📝 Line by line:\nPatient Name: John Doe\nDepartment: Ortho\nPhone: 1234567890\n\nOR\n\n📝 Comma separated:\nJohn Doe, Ortho, 1234567890\n\nType "cancel" to start over.`
    );
    await WhatsAppService.sendMessage(message);
  }

  // Step 4: Handle patient details and complete booking
  private static async handlePatientDetails(userPhone: string, messageText: string, userState: UserBookingState): Promise<void> {
    try {
      // Parse the message to extract patient details
      // First try comma-separated format, then fall back to line-by-line format
      let patientName = '';
      let department = '';
      let phone = '';

      // Check if it's comma-separated format
      if (messageText.includes(',')) {
        const parts = messageText.split(',').map(part => part.trim());
        
        if (parts.length >= 3) {
          // Assume format: name, department, phone
          patientName = parts[0];
          department = parts[1];
          phone = parts[2];
        }
      } else {
        // Fall back to line-by-line format
        const lines = messageText.split('\n');
        
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('patient name:') || lowerLine.includes('1️⃣')) {
            patientName = line.split(':')[1]?.trim() || line.replace('1️⃣', '').trim();
          } else if (lowerLine.includes('department:') || lowerLine.includes('2️⃣')) {
            department = line.split(':')[1]?.trim() || line.replace('2️⃣', '').trim();
          } else if (lowerLine.includes('phone') || lowerLine.includes('3️⃣')) {
            phone = line.split(':')[1]?.trim() || line.replace('3️⃣', '').trim();
          }
        }
      }

      // Validate required fields
      if (!patientName || !department || !phone) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Please provide all required information:\n\nPatient Name, Department, and Phone Number.\n\nPlease try again with the complete details.')
        );
        return;
      }

      // Validate department
      const validDepartments = ['ortho', 'ent'];
      if (!validDepartments.includes(department.toLowerCase())) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Invalid department. Please choose either "Ortho" or "ENT".')
        );
        return;
      }

      // Create appointment in database (this will fail if slot is already taken)
      const appointment: CreateAppointmentRequest = {
        patientName,
        department: (department.charAt(0).toUpperCase() + department.slice(1).toLowerCase()) as 'Ortho' | 'ENT',
        date: userState.selectedDate!,
        timeSlot: userState.selectedSlot!,
        patientPhone: phone
      };

      const result = await AppointmentService.createAppointment(appointment);
      
      if (!result.success) {
        // Check if the failure is due to slot already being taken
        if (result.error?.includes('already exists') || result.error?.includes('duplicate') || result.error?.includes('conflict')) {
                  await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Sorry, the slot ${userState.selectedDate} at ${userState.selectedSlot} was just booked by another user.\n\nPlease start over by typing "book" to choose a different time.`)
        );
        } else {
          await WhatsAppService.sendMessage(
            WhatsAppService.createTextMessage(userPhone, `❌ Sorry, there was an error creating your appointment: ${result.error}\n\nPlease try again or contact the clinic directly.`)
          );
        }
        
        // Clear the temporary reservation
        const reservationKey = `${userState.selectedDate}-${userState.selectedSlot}`;
        temporaryReservations.delete(reservationKey);
        userStates.delete(userPhone);
        return;
      }

      // Remove the temporary reservation since booking was successful
      const reservationKey = `${userState.selectedDate}-${userState.selectedSlot}`;
      temporaryReservations.delete(reservationKey);

      // Send confirmation and clear user state
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(
          userPhone,
          `✅ Appointment Confirmed!\n\n📋 Details:\n👤 Patient: ${patientName}\n🏥 Department: ${department}\n📅 Date: ${userState.selectedDate}\n⏰ Time: ${userState.selectedSlot}\n📱 Phone: ${phone}\n\nYour appointment has been scheduled. We'll contact you to confirm the details.`
        )
      );

      // Clear user state
      userStates.delete(userPhone);

    } catch (error) {
      console.error('Error processing patient details:', error);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Sorry, there was an error processing your appointment request. Please try again or contact the clinic directly.')
      );
    }
  }

  // Send user appointments
  private static async sendUserAppointments(recipientPhone: string): Promise<void> {
    const appointments = await AppointmentService.getAppointments();
    
    // Filter by recipient phone number and future dates only
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for date comparison
    
    const userAppointments = appointments.filter(apt => {
      const appointmentDate = new Date(apt.date);
      appointmentDate.setHours(0, 0, 0, 0);
      
      return apt.patientPhone === recipientPhone && appointmentDate >= today;
    });

    if (userAppointments.length === 0) {
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(
          recipientPhone,
          '📋 You have no future appointments scheduled.\n\nReply with "book" to schedule one!'
        )
      );
      return;
    }

    // Sort appointments by date and time
    userAppointments.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.timeSlot);
      const dateB = new Date(b.date + ' ' + b.timeSlot);
      return dateA.getTime() - dateB.getTime();
    });

    let appointmentText = '📋 Your Future Appointments:\n\n';
    userAppointments.forEach((apt, index) => {
      appointmentText += `${index + 1}. ${apt.patientName}\n`;
      appointmentText += `   📅 ${apt.date} at ${apt.timeSlot}\n`;
      appointmentText += `   🏥 ${apt.department}\n\n`;
    });

    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(recipientPhone, appointmentText)
    );
  }

  // Send help message
  private static async sendHelpMessage(recipientPhone: string): Promise<void> {
    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(
        recipientPhone,
        '❓ How can we help?\n\nAvailable commands:\n\n📅 "book" - Start step-by-step booking process\n📋 "my appointments" - View your appointments\n📊 "weekly" - Show weekly availability overview\n❓ "help" - Show this help message\n\n📝 Note: Appointments are only available on weekdays (Monday to Friday) during clinic hours.\n\nFor urgent matters, please call our clinic directly.'
      )
    );
  }

  // Send welcome message
  private static async sendWelcomeMessage(recipientPhone: string): Promise<void> {
    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(
        recipientPhone,
        'Welcome to Orent Clinic! 🏥\n\nWe\'re here to help you with your healthcare needs.\n\n📅 Appointments are available on weekdays (Monday to Friday) only.\n\nPlease reply with:\n\n📅 "book" - to start the step-by-step booking process\n📋 "my appointments" - to check your existing appointments\n📊 "weekly" - to see weekly availability overview\n❓ "help" - for assistance'
      )
    );
  }

  // Send weekly availability
  private static async sendWeeklyAvailability(recipientPhone: string): Promise<void> {
    try {
      const today = new Date();
      const currentWeek = [];
      
      // Get next 5 weekdays starting from today
      const currentDate = new Date(today);
      let daysFound = 0;
      
      while (daysFound < 5) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
          currentWeek.push(new Date(currentDate));
          daysFound++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      let weeklyText = '📅 Weekly Availability Overview\n\n';
      
      for (const date of currentWeek) {
        const dateStr = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
        
        const availability = await this.getAvailableSlotsWithReservations(date.toISOString().split('T')[0]);
        
        if (availability.error) {
          weeklyText += `${dateStr}: ❌ ${availability.error}\n`;
        } else if (availability.available.length === 0) {
          weeklyText += `${dateStr}: ❌ Fully booked\n`;
        } else {
          const availableCount = availability.available.length;
          const totalSlots = AVAILABLE_TIME_SLOTS.length;
          const reservedCount = availability.reserved.length;
          
          if (reservedCount > 0) {
            weeklyText += `${dateStr}: ✅ ${availableCount}/${totalSlots} slots available (${reservedCount} temporarily reserved)\n`;
          } else {
            weeklyText += `${dateStr}: ✅ ${availableCount}/${totalSlots} slots available\n`;
          }
        }
        weeklyText += '\n';
      }
      
      weeklyText += '💡 Tip: Use "book" to start the booking process.';
      
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(recipientPhone, weeklyText)
      );
      
    } catch (error) {
      console.error('Error sending weekly availability:', error);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(
          recipientPhone,
          '❌ Sorry, there was an error generating the weekly overview. Please try checking specific dates instead.'
        )
      );
    }
  }

  // Get available slots considering both database appointments and temporary reservations
  private static async getAvailableSlotsWithReservations(date: string): Promise<{ available: string[], booked: string[], reserved: string[], error?: string }> {
    try {
      // Get availability from database
      const availability = await AppointmentService.getAvailableSlotsForDate(date);
      
      if (availability.error) {
        return { available: [], booked: [], reserved: [], error: availability.error };
      }

      // Get slots that are temporarily reserved
      const reservedSlots: string[] = [];
      for (const [key] of temporaryReservations.entries()) {
        if (key.startsWith(`${date}-`)) {
          const slot = key.split('-')[1];
          reservedSlots.push(slot);
        }
      }

      // Remove reserved slots from available slots
      const trulyAvailable = availability.available.filter(slot => !reservedSlots.includes(slot));

      // Debug logging
      console.log(`getAvailableSlotsWithReservations for ${date}:`);
      console.log(`  Database available: ${availability.available.join(', ')}`);
      console.log(`  Database booked: ${availability.booked.join(', ')}`);
      console.log(`  Temporary reserved: ${reservedSlots.join(', ')}`);
      console.log(`  Final available: ${trulyAvailable.join(', ')}`);

      return {
        available: trulyAvailable,
        booked: availability.booked,
        reserved: reservedSlots
      };
    } catch (error) {
      console.error('Error getting availability with reservations:', error);
      return { available: [], booked: [], reserved: [], error: 'Error processing date' };
    }
  }

  // Test method to verify date conversion
  private static testDateConversion(dateInput: string): string {
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateInput.match(dateRegex);
    
    if (!match) {
      return 'Invalid format';
    }
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    
    // Manual formatting to avoid timezone issues
    const formattedDate = `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    console.log(`Date conversion test: "${dateInput}" -> "${formattedDate}"`);
    return formattedDate;
  }
} 