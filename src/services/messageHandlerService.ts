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
}

// In-memory storage for user states (in production, consider using a database)
const userStates = new Map<string, UserBookingState>();

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
    let userState = userStates.get(userPhone) || { step: 'idle' };

    if (messageText.includes('book') || messageText.includes('appointment') || messageText.includes('schedule')) {
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
      userStates.delete(userPhone);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Booking cancelled. You can start over by typing "book appointment".')
      );
    } else if (userState.step === 'waiting_for_date') {
      // User provided a date
      await this.handleDateSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_slot') {
      // User selected a slot (should be a button reply)
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
      const formattedDate = date.toISOString().split('T')[0];

      // Get available slots for this date
      const availability = await AppointmentService.getAvailableSlotsForDate(formattedDate);
      
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

      await this.showAvailableSlotsAsButtons(userPhone, dateInput, availability.available);

    } catch (error) {
      console.error('Error handling date selection:', error);
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(userPhone, '❌ Sorry, there was an error processing your date. Please try again or type "cancel" to start over.')
      );
    }
  }

  // Show available slots as interactive buttons
  private static async showAvailableSlotsAsButtons(recipientPhone: string, date: string, availableSlots: string[]): Promise<void> {
    // Create buttons for available slots (max 3 buttons per message)
    const buttons = availableSlots.slice(0, 3).map(slot => ({
      type: 'reply',
      reply: {
        id: `slot_${slot}`,
        title: slot
      }
    }));

    const message = WhatsAppService.createInteractiveMessage(
      recipientPhone,
      `📅 Available slots for ${date}:\n\nPlease select your preferred time:`,
      buttons
    );

    await WhatsAppService.sendMessage(message);

    // If there are more slots, send additional buttons
    if (availableSlots.length > 3) {
      const remainingSlots = availableSlots.slice(3);
      const additionalButtons = remainingSlots.map(slot => ({
        type: 'reply',
        reply: {
          id: `slot_${slot}`,
          title: slot
        }
      }));

      const additionalMessage = WhatsAppService.createInteractiveMessage(
        recipientPhone,
        'More available slots:',
        additionalButtons
      );

      await WhatsAppService.sendMessage(additionalMessage);
    }
  }

  // Step 3: Handle slot selection
  private static async handleSlotSelection(userPhone: string, slotInput: string, userState: UserBookingState): Promise<void> {
    try {
      // Extract slot from button reply (format: "slot_10:30")
      const slot = slotInput.replace('slot_', '');
      
      if (!AVAILABLE_TIME_SLOTS.includes(slot)) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Invalid slot selection. Please try again.')
        );
        return;
      }

      // Update user state
      userState.selectedSlot = slot;
      userState.step = 'waiting_for_details';
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
      `📋 Great! You've selected ${date} at ${time}.\n\nNow please provide:\n\n1️⃣ Patient Name:\n2️⃣ Department (Ortho/ENT):\n3️⃣ Phone Number:\n\nReply with all details in one message.\n\nType "cancel" to start over.`
    );
    await WhatsAppService.sendMessage(message);
  }

  // Step 4: Handle patient details and complete booking
  private static async handlePatientDetails(userPhone: string, messageText: string, userState: UserBookingState): Promise<void> {
    try {
      // Parse the message to extract patient details
      const lines = messageText.split('\n');
      let patientName = '';
      let department = '';
      let phone = '';

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

      // Check if slot is still available
      const availability = await AppointmentService.getAvailableSlotsForDate(userState.selectedDate!);
      if (!availability.available.includes(userState.selectedSlot!)) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, `❌ Sorry, the slot ${userState.selectedDate} at ${userState.selectedSlot} is no longer available.\n\nPlease start over by typing "book appointment".`)
        );
        userStates.delete(userPhone);
        return;
      }

      // Create appointment in database
      const appointment: CreateAppointmentRequest = {
        patientName,
        department: (department.charAt(0).toUpperCase() + department.slice(1).toLowerCase()) as 'Ortho' | 'ENT',
        date: userState.selectedDate!,
        timeSlot: userState.selectedSlot!,
        patientPhone: phone
      };

      const result = await AppointmentService.createAppointment(appointment);
      
      if (!result.success) {
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, '❌ Sorry, there was an error creating your appointment. Please try again or contact the clinic directly.')
        );
        return;
      }

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
    const userAppointments = appointments.filter(apt => apt.patientPhone === recipientPhone);

    if (userAppointments.length === 0) {
      await WhatsAppService.sendMessage(
        WhatsAppService.createTextMessage(
          recipientPhone,
          '📋 You have no appointments scheduled.\n\nReply with "book appointment" to schedule one!'
        )
      );
      return;
    }

    let appointmentText = '📋 Your Appointments:\n\n';
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
        '❓ How can we help?\n\nAvailable commands:\n\n📅 "book appointment" - Start step-by-step booking process\n📋 "my appointments" - View your appointments\n📊 "weekly" - Show weekly availability overview\n❓ "help" - Show this help message\n\n📝 Note: Appointments are only available on weekdays (Monday to Friday) during clinic hours.\n\nFor urgent matters, please call our clinic directly.'
      )
    );
  }

  // Send welcome message
  private static async sendWelcomeMessage(recipientPhone: string): Promise<void> {
    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(
        recipientPhone,
        'Welcome to Orent Clinic! 🏥\n\nWe\'re here to help you with your healthcare needs.\n\n📅 Appointments are available on weekdays (Monday to Friday) only.\n\nPlease reply with:\n\n📅 "book appointment" - to start the step-by-step booking process\n📋 "my appointments" - to check your existing appointments\n📊 "weekly" - to see weekly availability overview\n❓ "help" - for assistance'
      )
    );
  }

  // Send weekly availability
  private static async sendWeeklyAvailability(recipientPhone: string): Promise<void> {
    try {
      const today = new Date();
      const currentWeek = [];
      
      // Get next 5 weekdays starting from today
      let currentDate = new Date(today);
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
        
        const availability = await AppointmentService.getAvailableSlotsForDate(date.toISOString().split('T')[0]);
        
        if (availability.error) {
          weeklyText += `${dateStr}: ❌ ${availability.error}\n`;
        } else if (availability.available.length === 0) {
          weeklyText += `${dateStr}: ❌ Fully booked\n`;
        } else {
          const availableCount = availability.available.length;
          const totalSlots = AVAILABLE_TIME_SLOTS.length;
          weeklyText += `${dateStr}: ✅ ${availableCount}/${totalSlots} slots available\n`;
        }
        weeklyText += '\n';
      }
      
      weeklyText += '💡 Tip: Use "book appointment" to start the booking process.';
      
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
} 