import { WhatsAppService } from './whatsappService';
import { AppointmentService, AVAILABLE_TIME_SLOTS } from './appointmentService';
import { formatTimeSlotsTo12Hour, formatTimeTo12Hour, parseFlexibleTimeInput } from '../utils/timeUtils';
import type { CreateAppointmentRequest } from '../types/appointment';

// User booking state tracking
export interface UserBookingState {
  step: 'idle' | 'waiting_for_department' | 'waiting_for_date' | 'waiting_for_slot' | 'waiting_for_details';
  selectedDepartment?: 'Ortho' | 'ENT';
  selectedDate?: string;
  selectedSlot?: string;
  tempData?: {
    patientName?: string;
    phoneNumber?: string;
    department?: string;
  };
  reservationTime?: number; // Track when slot was reserved
  lastActivityTime?: number; // Track when user was last active
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
    console.log(`Checking user state for cleanup: ${userPhone}, step: ${userState.step}, reservationTime: ${userState.reservationTime}`);
    
    if (userState.reservationTime && (now - userState.reservationTime > 30 * 60 * 1000)) {
      // Clear expired reservation
      if (userState.selectedDate && userState.selectedSlot) {
        const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${userState.selectedSlot}`;
        temporaryReservations.delete(reservationKey);
      }
      console.log(`Clearing expired user state for ${userPhone}`);
      userStates.delete(userPhone);
    } else if (!userState.reservationTime && userState.step !== 'idle') {
      // Clear user states that have been in non-idle steps for too long (e.g., 10 minutes)
      // This prevents users from getting stuck in intermediate steps
      const userStateAge = now - (userState.lastActivityTime || now);
      if (userStateAge > 10 * 60 * 1000) { // 10 minutes
        console.log(`Clearing stale user state for ${userPhone} (step: ${userState.step}, age: ${userStateAge}ms)`);
        userStates.delete(userPhone);
      }
    }
  }
}, 60000); // Check every minute

export class MessageHandlerService {
  // Helper function to convert internal department names to user-friendly names
  private static getDisplayDepartmentName(department: 'Ortho' | 'ENT'): string {
    return department === 'Ortho' ? 'Orthopedics' : department;
  }

  // Normalize phone number for comparison (remove country code, spaces, dashes, etc.)
  private static normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');
    
    // If it starts with country code (e.g., 91 for India), remove it
    // For now, we'll assume local numbers are 10 digits
    if (normalized.length > 10) {
      normalized = normalized.slice(-10); // Take last 10 digits
    }
    
    return normalized;
  }

  // Handle incoming WhatsApp messages
  static async handleIncomingMessage(message: {
    from: string;
    text?: { body: string };
    type: string;
  }): Promise<void> {
    const userPhone = message.from;
    const messageText = message.text?.body?.toLowerCase() || '';
    
    // Debug: Log the raw message data
    console.log(`Raw message:`, message);
    console.log(`Phone number: "${userPhone}"`);

    // Get or create user state
    const userState = userStates.get(userPhone) || { step: 'idle' };
    
    // Update last activity time
    userState.lastActivityTime = Date.now();
    
    // Save the updated user state
    userStates.set(userPhone, userState);
    
    // Debug logging
    console.log(`Message from ${userPhone}: "${messageText}"`);
    console.log(`Current user state:`, userState);
    console.log(`All user states:`, Array.from(userStates.entries()));

    if (messageText.includes('book')) {
      // Start booking flow
      console.log(`Starting booking flow for ${userPhone}`);
      userState.step = 'waiting_for_department';
      userState.lastActivityTime = Date.now();
      userStates.set(userPhone, userState);
      console.log(`Set user state to waiting_for_department:`, userStates.get(userPhone));
      await this.askForDepartment(userPhone);
    } else if (messageText.includes('my appointments') || messageText.includes('check')) {
      await this.sendUserAppointments(userPhone);
    } else if (messageText.includes('help')) {
      await this.sendHelpMessage(userPhone);
    } else if (messageText.includes('weekly') || messageText.includes('week')) {
      await this.sendWeeklyAvailability(userPhone);
    } else if (messageText.includes('cancel') || messageText.includes('stop')) {
      // Cancel booking flow
      const existingUserState = userStates.get(userPhone);
      if (existingUserState && existingUserState.selectedDate && existingUserState.selectedSlot) {
        // Clear the temporary reservation
        const reservationKey = `${existingUserState.selectedDate}-${existingUserState.selectedDepartment}-${existingUserState.selectedSlot}`;
        temporaryReservations.delete(reservationKey);
      }
      console.log(`Clearing user state for ${userPhone} due to cancellation`);
      userStates.delete(userPhone);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Booking cancelled. You can start over by typing "book".')
      );
    } else if (userState.step === 'waiting_for_department') {
      // User provided a department
      console.log(`Handling department selection for step: ${userState.step}`);
      await this.handleDepartmentSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_date') {
      // User provided a date
      console.log(`Handling date selection for step: ${userState.step}`);
      await this.handleDateSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_slot') {
      // User provided a time slot as text
      console.log(`Handling slot selection for step: ${userState.step}`);
      await this.handleSlotSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_details') {
      // User providing patient details
      console.log(`Handling patient details for step: ${userState.step}`);
      await this.handlePatientDetails(userPhone, messageText, userState);
    } else {
      console.log(`No matching step found, sending welcome message. Step was: ${userState.step}`);
      await this.sendWelcomeMessage(userPhone);
    }
  }

  // Step 1: Ask user for department
  private static async askForDepartment(recipientPhone: string): Promise<void> {
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      '🏥 Please select your department:\n\n1️⃣ Orthopedics\n2️⃣ ENT\n\nType "1" for Orthopedics or "2" for ENT.\nType "cancel" to stop the booking process.'
    );
    await WhatsAppService.sendMessage(message);
  }

  // Step 2: Handle department selection
  private static async handleDepartmentSelection(userPhone: string, departmentInput: string, userState: UserBookingState): Promise<void> {
    try {
      // Clean the input - remove any extra spaces
      const department = departmentInput.trim();
      
      if (department === '1' || department === 'ortho') {
        userState.selectedDepartment = 'Ortho';
        console.log(`User selected Ortho department`);
      } else if (department === '2' || department === 'ent') {
        userState.selectedDepartment = 'ENT';
        console.log(`User selected ENT department`);
      } else {
        console.log(`Invalid department selection: "${department}"`);
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Invalid department selection. Please type "1" for Orthopedics or "2" for ENT.')
        );
        return;
      }

      // Update user state
      userState.step = 'waiting_for_date';
      userState.lastActivityTime = Date.now();
      userStates.set(userPhone, userState);
      
      // Debug logging
      console.log(`Updated user state for ${userPhone}:`, userState);
      console.log(`Stored user state:`, userStates.get(userPhone));

      // Ask for date
      await this.askForDate(userPhone);

    } catch (error) {
      console.error('Error handling department selection:', error);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Sorry, there was an error processing your department selection. Please try again or type "cancel" to start over.')
      );
    }
  }

  // Step 1: Ask user for date
  private static async askForDate(recipientPhone: string): Promise<void> {
    const userState = userStates.get(recipientPhone);
    const department = userState?.selectedDepartment ? this.getDisplayDepartmentName(userState.selectedDepartment) : 'your selected department';
    
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `📅 Let's book your appointment for ${department}!\n\nPlease provide the date you'd like to book in dd/mm/yyyy format (e.g., 25/12/2024).\n\nNote: Appointments are only available on weekdays (Monday to Friday).\n\nType "cancel" to stop the booking process.`
    );
    await WhatsAppService.sendMessage(message);
  }

  // Step 2: Handle date selection and show available slots
  private static async handleDateSelection(userPhone: string, dateInput: string, userState: UserBookingState): Promise<void> {
    try {
      console.log(`Handling date selection for ${userPhone}: "${dateInput}"`);
      console.log(`User state at start of date selection:`, userState);
      
      // Validate date format - only accept dd/mm/yyyy
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = dateInput.match(dateRegex);
      
      if (!match) {
        console.log(`Invalid date format: "${dateInput}"`);
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
      const availability = await this.getAvailableSlotsWithReservations(formattedDate, userState.selectedDepartment!);
      
      // Debug logging
      console.log(`Date: ${formattedDate}, Department: ${userState.selectedDepartment}, Available: ${availability.available.join(', ')}, Booked: ${availability.booked.join(', ')}, Reserved: ${availability.reserved.join(', ')}`);
      
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
          WhatsAppService.createTextMessage(userPhone, `📅 ${dateInput} (${userState.selectedDepartment})\n\n❌ No available slots for this date and department.\n\nAll time slots are booked. Please choose a different date or type "cancel" to stop.`)
        );
        return;
      }

      // Update user state and show available slots as buttons
      userState.selectedDate = formattedDate; // Store formatted date for database
      userState.step = 'waiting_for_slot';
      userState.lastActivityTime = Date.now();
      userStates.set(userPhone, userState);
      
      console.log(`Updated user state after date selection:`, userState);
      console.log(`Stored user state:`, userStates.get(userPhone));

      await this.showAvailableSlotsAsText(userPhone, dateInput, availability.available, userState.selectedDepartment!);

    } catch (error) {
      console.error('Error handling date selection:', error);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Sorry, there was an error processing your date. Please try again or type "cancel" to start over.')
      );
    }
  }

  // Show available slots as text (instead of buttons)
  private static async showAvailableSlotsAsText(recipientPhone: string, date: string, availableSlots: string[], department: 'Ortho' | 'ENT'): Promise<void> {
    // Convert time slots to 12-hour format for display
    const formattedSlots = formatTimeSlotsTo12Hour(availableSlots);
    const slotsText = formattedSlots.join(', ');
    const displayDepartment = this.getDisplayDepartmentName(department);
    
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `📅 Available slots for ${date} (${displayDepartment}):\n\n⏰ ${slotsText}\n\nPlease type your preferred time slot in any format:\n• 10:30 (assumes AM)\n• 1:30 (assumes PM)\n• 10:30 AM or 1:30 PM\n• 13:30 (24-hour format)\n\n⚠️ Note: Slots are checked for availability when you select them.`
    );

    await WhatsAppService.sendMessage(message);
  }

  // Step 3: Handle slot selection (now handles text input instead of button clicks)
  private static async handleSlotSelection(userPhone: string, slotInput: string, userState: UserBookingState): Promise<void> {
    try {
      console.log(`Handling slot selection for ${userPhone}: "${slotInput}"`);
      console.log(`User state at start of slot selection:`, userState);
      
      // Parse flexible time input (accepts both 12-hour and 24-hour formats)
      const parsedSlot = parseFlexibleTimeInput(slotInput);
      
      if (!parsedSlot) {
        // Convert time slots to 12-hour format for display
        const formattedSlots = formatTimeSlotsTo12Hour(AVAILABLE_TIME_SLOTS);
        const slotsText = formattedSlots.join(', ');
        
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Invalid time format: "${slotInput}".\n\nPlease type a time in any of these formats:\n• 10:30 (assumes AM)\n• 1:30 (assumes PM)\n• 10:30 AM or 1:30 PM\n• 13:30 (24-hour format)\n\nAvailable slots: ${slotsText}`)
        );
        return;
      }
      
      // Check if the parsed slot is in our available slots
      if (!AVAILABLE_TIME_SLOTS.includes(parsedSlot)) {
        // Convert time slots to 12-hour format for display
        const formattedSlots = formatTimeSlotsTo12Hour(AVAILABLE_TIME_SLOTS);
        const slotsText = formattedSlots.join(', ');
        
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Time "${slotInput}" (${parsedSlot}) is not available.\n\nPlease choose from these available slots: ${slotsText}`)
        );
        return;
      }

      // Immediately check if the slot is still available in the database
      const currentAvailability = await AppointmentService.getAvailableSlotsForDate(userState.selectedDate!, userState.selectedDepartment!);
      
      if (currentAvailability.error) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Sorry, there was an error checking slot availability. Please try again or type "cancel" to start over.`)
        );
        return;
      }

      // Check if the slot is still available in the database
      if (!currentAvailability.available.includes(parsedSlot)) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Sorry, the slot ${parsedSlot} is no longer available. It may have been booked by another user.\n\nPlease choose a different time slot from the available options.`)
        );
        return;
      }

      // Check if slot is already reserved by another user
      const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${parsedSlot}`;
      const existingReservation = temporaryReservations.get(reservationKey);
      
      if (existingReservation && existingReservation.userId !== userPhone) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Sorry, the slot ${parsedSlot} was just reserved by another user. Please choose a different time slot.`)
        );
        return;
      }

      // Reserve this slot for this user
      temporaryReservations.set(reservationKey, { userId: userPhone, timestamp: Date.now() });
      
      // Update user state
      userState.selectedSlot = parsedSlot;
      userState.step = 'waiting_for_details';
      userState.reservationTime = Date.now();
      userState.lastActivityTime = Date.now();
      userStates.set(userPhone, userState);
      
      console.log(`Updated user state after slot selection:`, userState);
      console.log(`Stored user state:`, userStates.get(userPhone));

      // Ask for patient details
      await this.askForPatientDetails(userPhone, userState.selectedDate!, parsedSlot, userState.selectedDepartment!);

    } catch (error) {
      console.error('Error handling slot selection:', error);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Sorry, there was an error processing your slot selection. Please try again or type "cancel" to start over.')
      );
    }
  }

  // Ask for patient details
  private static async askForPatientDetails(recipientPhone: string, date: string, time: string, department: 'Ortho' | 'ENT'): Promise<void> {
    const displayDepartment = this.getDisplayDepartmentName(department);
    // Convert time to 12-hour format for display
    const formattedTime = formatTimeTo12Hour(time);
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `📋 Great! You've selected ${date} at ${formattedTime} for ${displayDepartment}.\n\nNow please provide:\n\n1️⃣ Patient Name:\n2️⃣ Phone Number:\n\nYou can reply in two formats:\n\n📝 Line by line:\nPatient Name: John Doe\nPhone: 1234567890\n\nOR\n\n📝 Comma separated:\nJohn Doe, 1234567890\n\nType "cancel" to start over.`
    );
    await WhatsAppService.sendMessage(message);
  }

  // Step 4: Handle patient details and complete booking
  private static async handlePatientDetails(userPhone: string, messageText: string, userState: UserBookingState): Promise<void> {
    try {
      console.log(`Handling patient details for ${userPhone}: "${messageText}"`);
      console.log(`User state at start of patient details:`, userState);
      
      // Parse the message to extract patient details
      // First try comma-separated format, then fall back to line-by-line format
      let patientName = '';
      let phone = '';

      // Check if it's comma-separated format
      if (messageText.includes(',')) {
        const parts = messageText.split(',').map(part => part.trim());
        
        if (parts.length >= 2) {
          // Assume format: name, phone
          patientName = parts[0];
          phone = parts[1];
        }
      } else {
        // Fall back to line-by-line format
        const lines = messageText.split('\n');
        
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('patient name:') || lowerLine.includes('1️⃣')) {
            patientName = line.split(':')[1]?.trim() || line.replace('1️⃣', '').trim();
          } else if (lowerLine.includes('phone') || lowerLine.includes('2️⃣')) {
            phone = line.split(':')[1]?.trim() || line.replace('2️⃣', '').trim();
          }
        }
      }

      // Validate required fields
      if (!patientName || !phone) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Please provide all required information:\n\nPatient Name and Phone Number.\n\nPlease try again with the complete details.')
        );
        return;
      }

      // Create appointment in database (this will fail if slot is already taken)
      console.log(`Creating appointment with data:`, { patientName, department: userState.selectedDepartment, date: userState.selectedDate, timeSlot: userState.selectedSlot, patientPhone: phone });
      
      const appointment: CreateAppointmentRequest = {
        patientName,
        department: userState.selectedDepartment!,
        date: userState.selectedDate!,
        timeSlot: userState.selectedSlot!,
        patientPhone: phone
      };

      const result = await AppointmentService.createAppointment(appointment);
      
      if (!result.success) {
        console.log(`Failed to create appointment for ${userPhone}: ${result.error}`);
        
        // Check if the failure is due to slot already being taken
        if (result.error?.includes('already exists') || result.error?.includes('duplicate') || result.error?.includes('conflict')) {
                  const displayDepartment = this.getDisplayDepartmentName(userState.selectedDepartment!);
                  await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Sorry, the slot ${userState.selectedDate} at ${userState.selectedSlot} for ${displayDepartment} was just booked by another user.\n\nPlease start over by typing "book" to choose a different time.`)
        );
        } else {
          await WhatsAppService.sendMessage(
            WhatsAppService.createTextMessage(userPhone, `❌ Sorry, there was an error creating your appointment: ${result.error}\n\nPlease try again or contact the clinic directly.`)
          );
        }
        
                  // Clear the temporary reservation
          const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${userState.selectedSlot}`;
          temporaryReservations.delete(reservationKey);
          console.log(`Clearing user state for ${userPhone} due to failure`);
          userStates.delete(userPhone);
        return;
      }

              // Remove the temporary reservation since booking was successful
        const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${userState.selectedSlot}`;
        temporaryReservations.delete(reservationKey);

      // Send confirmation and clear user state
      const displayDepartment = this.getDisplayDepartmentName(userState.selectedDepartment!);
      console.log(`Appointment created successfully for ${userPhone}`);
      
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(
          userPhone,
          `✅ Appointment Confirmed!\n\n📋 Details:\n👤 Patient: ${patientName}\n🏥 Department: ${displayDepartment}\n📅 Date: ${userState.selectedDate}\n⏰ Time: ${userState.selectedSlot}\n📱 Phone: ${phone}\n\nYour appointment has been scheduled. We'll contact you to confirm the details.`
        )
      );

      // Clear user state
      console.log(`Clearing user state for ${userPhone}`);
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
    console.log(`=== DEBUG: sendUserAppointments for phone: ${recipientPhone} ===`);
    
    const appointments = await AppointmentService.getAppointments();
    console.log(`Total appointments in database: ${appointments.length}`);
    
    // Log all appointments for debugging
    appointments.forEach((apt, index) => {
      console.log(`Appointment ${index + 1}: Date: ${apt.date}, Time: ${apt.timeSlot}, Patient: ${apt.patientName}, Phone: ${apt.patientPhone}, Department: ${apt.department}`);
    });
    
    // Filter by recipient phone number and future dates only
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for date comparison
    console.log(`Today's date (reset to start of day): ${today.toISOString()}`);
    console.log(`Today's date (local): ${today.toLocaleDateString()}`);
    
    const userAppointments = appointments.filter(apt => {
      const appointmentDate = new Date(apt.date);
      appointmentDate.setHours(0, 0, 0, 0);
      
      // Normalize both phone numbers for comparison
      const normalizedAppointmentPhone = this.normalizePhoneNumber(apt.patientPhone);
      const normalizedRecipientPhone = this.normalizePhoneNumber(recipientPhone);
      
      const phoneMatch = normalizedAppointmentPhone === normalizedRecipientPhone;
      const isFuture = appointmentDate >= today;
      
      console.log(`Checking appointment: Phone match: ${phoneMatch} (${normalizedAppointmentPhone} vs ${normalizedRecipientPhone}), Future date: ${isFuture} (${appointmentDate.toISOString()} >= ${today.toISOString()})`);
      console.log(`  Raw appointment date: ${apt.date}, Parsed: ${appointmentDate.toISOString()}`);
      
      return phoneMatch && isFuture;
    });

    console.log(`Filtered appointments for user: ${userAppointments.length}`);
    console.log(`=== End debug ===`);

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
      const displayDepartment = this.getDisplayDepartmentName(apt.department as 'Ortho' | 'ENT');
      appointmentText += `${index + 1}. ${apt.patientName}\n`;
      appointmentText += `   📅 ${apt.date} at ${apt.timeSlot}\n`;
      appointmentText += `   🏥 ${displayDepartment}\n\n`;
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
        '❓ How can we help?\n\nAvailable commands:\n\n📅 "book" - Start step-by-step booking process (Department → Date → Time → Details)\n📋 "my appointments" - View your appointments\n📊 "weekly" - Show weekly availability overview for both departments\n❓ "help" - Show this help message\n\n⏰ Time Input Formats:\n• 10:30 (assumes AM)\n• 1:30 (assumes PM)\n• 10:30 AM or 1:30 PM\n• 13:30 (24-hour format)\n\n📝 Note: Appointments are only available on weekdays (Monday to Friday) during clinic hours.\n\nFor urgent matters, please call our clinic directly.'
      )
    );
  }

  // Send welcome message
  private static async sendWelcomeMessage(recipientPhone: string): Promise<void> {
    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(
        recipientPhone,
        'Welcome to Orent Clinic! 🏥\n\nWe\'re here to help you with your healthcare needs.\n\n📅 Appointments are available on weekdays (Monday to Friday) only.\n\n⏰ Time Input Formats:\n• 10:30 (assumes AM)\n• 1:30 (assumes PM)\n• 10:30 AM or 1:30 PM\n• 13:30 (24-hour format)\n\nPlease reply with:\n\n📅 "book" - to start the step-by-step booking process (Department → Date → Time → Details)\n📋 "my appointments" - to check your existing appointments\n📊 "weekly" - to see weekly availability overview for both departments\n❓ "help" - for assistance'
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
        
        const dateFormatted = date.toISOString().split('T')[0];
        
        // Check availability for both departments
        const orthoAvailability = await this.getAvailableSlotsWithReservations(dateFormatted, 'Ortho');
        const entAvailability = await this.getAvailableSlotsWithReservations(dateFormatted, 'ENT');
        
        weeklyText += `${dateStr}:\n`;
        
        if (orthoAvailability.error) {
          weeklyText += `  🦴 Orthopedics: ❌ ${orthoAvailability.error}\n`;
        } else {
          const orthoAvailableCount = orthoAvailability.available.length;
          const totalSlots = AVAILABLE_TIME_SLOTS.length;
          const orthoReservedCount = orthoAvailability.reserved.length;
          
          if (orthoReservedCount > 0) {
            weeklyText += `  🦴 Orthopedics: ✅ ${orthoAvailableCount}/${totalSlots} slots available (${orthoReservedCount} temporarily reserved)\n`;
          } else {
            weeklyText += `  🦴 Orthopedics: ✅ ${orthoAvailableCount}/${totalSlots} slots available\n`;
          }
        }
        
        if (entAvailability.error) {
          weeklyText += `  👂 ENT: ❌ ${entAvailability.error}\n`;
        } else {
          const entAvailableCount = entAvailability.available.length;
          const totalSlots = AVAILABLE_TIME_SLOTS.length;
          const entReservedCount = entAvailability.reserved.length;
          
          if (entReservedCount > 0) {
            weeklyText += `  👂 ENT: ✅ ${entAvailableCount}/${totalSlots} slots available (${entReservedCount} temporarily reserved)\n`;
          } else {
            weeklyText += `  👂 ENT: ✅ ${entAvailableCount}/${totalSlots} slots available\n`;
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
  private static async getAvailableSlotsWithReservations(date: string, department: 'Ortho' | 'ENT'): Promise<{ available: string[], booked: string[], reserved: string[], error?: string }> {
    try {
      // Get availability from database
      const availability = await AppointmentService.getAvailableSlotsForDate(date, department);
      
      if (availability.error) {
        return { available: [], booked: [], reserved: [], error: availability.error };
      }

      // Get slots that are temporarily reserved
      const reservedSlots: string[] = [];
      for (const [key] of temporaryReservations.entries()) {
        if (key.startsWith(`${date}-${department}-`)) {
          const slot = key.split('-')[2];
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