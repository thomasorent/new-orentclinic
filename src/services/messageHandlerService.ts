// Main message handler service
// Now focused only on message routing and delegation to specialized services

import { AppointmentService } from './appointmentService';
import { UserStateService } from './userStateService';
import { MessageGeneratorService } from './messageGeneratorService';
import { BookingFlowService } from './bookingFlowService';

export class MessageHandlerService {
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
    const userState = UserStateService.getUserState(userPhone);
    
    // Update last activity time
    userState.lastActivityTime = Date.now();
    
    // Save the updated user state
    UserStateService.setUserState(userPhone, userState);
    
    // Debug logging
    console.log(`Message from ${userPhone}: "${messageText}"`);
    console.log(`Current user state:`, userState);

    if (messageText.includes('book')) {
      // Start booking flow
      console.log(`Starting booking flow for ${userPhone}`);
      UserStateService.updateUserStep(userPhone, 'waiting_for_booking_confirmation');
      console.log(`Set user state to waiting_for_booking_confirmation:`, UserStateService.getUserState(userPhone));
      await MessageGeneratorService.sendBookingInfo(userPhone);
    } else if (messageText.includes('my appointments') || messageText.includes('check')) {
      await this.sendUserAppointments(userPhone);
    } else if (messageText.includes('help')) {
      await MessageGeneratorService.sendHelpMessage(userPhone);
    } else if (messageText.includes('weekly') || messageText.includes('week')) {
      await this.sendWeeklyAvailability(userPhone);
    } else if (messageText.includes('cancel') || messageText.includes('stop')) {
      // Cancel booking flow
      const existingUserState = UserStateService.getUserState(userPhone);
      if (existingUserState && existingUserState.selectedDate && existingUserState.selectedSlot) {
        // Clear the temporary reservation
        const reservationKey = `${existingUserState.selectedDate}-${existingUserState.selectedDepartment}-${existingUserState.selectedSlot}`;
        UserStateService.deleteTemporaryReservation(reservationKey);
      }
      console.log(`Clearing user state for ${userPhone} due to cancellation`);
      UserStateService.deleteUserState(userPhone);
      await MessageGeneratorService.sendCancellationMessage(userPhone);
    } else if (userState.step === 'waiting_for_booking_confirmation') {
      // User confirming they want to continue with booking
      console.log(`Handling booking confirmation for step: ${userState.step}`);
      await BookingFlowService.handleBookingConfirmation(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_department') {
      // User provided a department
      console.log(`Handling department selection for step: ${userState.step}`);
      await BookingFlowService.handleDepartmentSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_date') {
      // User provided a date
      console.log(`Handling date selection for step: ${userState.step}`);
      await BookingFlowService.handleDateSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_slot') {
      // User provided a time slot as text
      console.log(`Handling slot selection for step: ${userState.step}`);
      await BookingFlowService.handleSlotSelection(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_details') {
      // User providing patient details
      console.log(`Handling patient details for step: ${userState.step}`);
      await BookingFlowService.handlePatientDetails(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_payment') {
      // User confirming payment
      console.log(`Handling payment confirmation for step: ${userState.step}`);
      await BookingFlowService.handlePaymentConfirmation(userPhone, messageText, userState);
    } else if (userState.step === 'waiting_for_payment_confirmation') {
      // User clicked payment button or payment webhook received
      console.log(`Handling payment confirmation for step: ${userState.step}`);
      await BookingFlowService.handlePaymentWebhook(userPhone, messageText, userState);
    } else {
      console.log(`No matching step found, sending welcome message. Step was: ${userState.step}`);
      await MessageGeneratorService.sendWelcomeMessage(userPhone);
    }
  }

  // Send user appointments
  private static async sendUserAppointments(recipientPhone: string): Promise<void> {
    try {
      // Get user's phone number (normalized)
      const normalizedPhone = this.normalizePhoneNumber(recipientPhone);
      
      // Get appointments from database
      const allAppointments = await AppointmentService.getAppointments();
      
      // Filter by phone number
      const appointments = allAppointments.filter(apt => {
        const normalizedAppointmentPhone = this.normalizePhoneNumber(apt.patientPhone);
        return normalizedAppointmentPhone === normalizedPhone;
      });
      
      if (appointments.length === 0) {
        await MessageGeneratorService.sendErrorMessage(
          recipientPhone, 
          '📋 You have no appointments scheduled.\n\nTo book an appointment, type "book".'
        );
        return;
      }
      
      // Format appointments for display
      let appointmentsText = '📋 *Your Appointments:*\n\n';
      
      for (const appointment of appointments) {
        const date = new Date(appointment.date).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
        
        appointmentsText += `📅 **${date}** at **${appointment.timeSlot}**\n`;
        appointmentsText += `🏥 **Department:** ${appointment.department}\n`;
        appointmentsText += `👤 **Patient:** ${appointment.patientName}\n\n`;
      }
      
      appointmentsText += 'To book a new appointment, type "book".';
      
      await MessageGeneratorService.sendUserAppointments(recipientPhone, appointmentsText);
      
    } catch (error) {
      console.error('Error sending user appointments:', error);
      await MessageGeneratorService.sendErrorMessage(
        recipientPhone, 
        '❌ Sorry, there was an error retrieving your appointments. Please call us at 934 934 5538 for assistance.'
      );
    }
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
          const totalSlots = 8; // Assuming 8 slots per day
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
          const totalSlots = 8; // Assuming 8 slots per day
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
      
      await MessageGeneratorService.sendWeeklyAvailability(recipientPhone, weeklyText);
      
    } catch (error) {
      console.error('Error sending weekly availability:', error);
      await MessageGeneratorService.sendErrorMessage(
        recipientPhone, 
        '❌ Sorry, there was an error retrieving weekly availability. Please call us at 934 934 5538 for assistance.'
      );
    }
  }

  // Get available slots with reservations (helper method)
  private static async getAvailableSlotsWithReservations(date: string, department: 'Ortho' | 'ENT'): Promise<{
    available: string[];
    booked: string[];
    reserved: string[];
    error?: string;
  }> {
    try {
      const availability = await AppointmentService.getAvailableSlotsForDate(date, department);
      
      if (availability.error) {
        return { available: [], booked: [], reserved: [], error: availability.error };
      }
      
      // Filter out temporarily reserved slots
      const reservedSlots: string[] = [];
      const availableSlots = availability.available.filter(slot => {
        const reservationKey = `${date}-${department}-${slot}`;
        const reservation = UserStateService.getTemporaryReservation(reservationKey);
        
        if (reservation) {
          reservedSlots.push(slot);
          return false; // Remove from available
        }
        return true; // Keep in available
      });
      
      return {
        available: availableSlots,
        booked: availability.booked,
        reserved: reservedSlots
      };
      
    } catch (error) {
      console.error('Error getting available slots:', error);
      return {
        available: [],
        booked: [],
        reserved: [],
        error: 'Failed to get available slots'
      };
    }
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
} 