// Booking flow service
// Handles all booking flow logic and state transitions

import { WhatsAppService } from './whatsappService';
import { AppointmentService, AVAILABLE_TIME_SLOTS } from './appointmentService';
import { ValidationService } from './validationService';
import { MessageGeneratorService } from './messageGeneratorService';
import { UserStateService } from './userStateService';
import { parseFlexibleTimeInput } from '../utils/timeUtils';
import type { UserBookingState } from './userStateService';

export class BookingFlowService {
  // Handle booking confirmation
  static async handleBookingConfirmation(userPhone: string, messageText: string, _userState: UserBookingState): Promise<void> {
    const response = messageText.toLowerCase().trim();
    
    if (response === 'yes' || response === 'continue' || response === 'ok' || response === 'proceed') {
      // User confirmed, proceed to department selection
      UserStateService.updateUserStep(userPhone, 'waiting_for_department');
      
      console.log(`User confirmed booking, proceeding to department selection for ${userPhone}`);
      await MessageGeneratorService.askForDepartment(userPhone);
    } else if (response === 'cancel' || response === 'no' || response === 'stop') {
      // User cancelled
      console.log(`User cancelled booking for ${userPhone}`);
      UserStateService.deleteUserState(userPhone);
      await MessageGeneratorService.sendCancellationMessage(userPhone);
    } else {
      // Invalid response
      await MessageGeneratorService.sendErrorMessage(
        userPhone, 
        '❓ Please reply with "yes" to continue or "cancel" to stop the booking process.'
      );
    }
  }

  // Handle department selection
  static async handleDepartmentSelection(userPhone: string, departmentInput: string, userState: UserBookingState): Promise<void> {
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
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          '❌ Invalid department selection. Please type "1" for Orthopedics or "2" for ENT.'
        );
        return;
      }

      // Update user state
      UserStateService.updateUserStep(userPhone, 'waiting_for_date');
      
      // Debug logging
      console.log(`Updated user state for ${userPhone}:`, userState);
      console.log(`Stored user state:`, UserStateService.getUserState(userPhone));

      // Ask for date
      await MessageGeneratorService.askForDate(userPhone, userState.selectedDepartment);

    } catch (error) {
      console.error('Error handling department selection:', error);
      await MessageGeneratorService.sendErrorMessage(
        userPhone, 
        '❌ Sorry, there was an error processing your department selection. Please try again or type "cancel" to start over.'
      );
    }
  }

  // Handle date selection and show available slots
  static async handleDateSelection(userPhone: string, dateInput: string, userState: UserBookingState): Promise<void> {
    try {
      console.log(`Handling date selection for ${userPhone}: "${dateInput}"`);
      console.log(`User state at start of date selection:`, userState);
      
      // Use comprehensive date validation
      const dateValidation = ValidationService.validateAppointmentDate(dateInput);
      
      if (!dateValidation.isValid) {
        console.log(`Date validation failed: ${dateValidation.error}`);
        await MessageGeneratorService.sendErrorMessage(userPhone, `❌ ${dateValidation.error}`);
        return;
      }

      const { formattedDate } = dateValidation;
      
      if (!formattedDate) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          '❌ Date validation failed. Please try again.'
        );
        return;
      }
      
      // Debug: Log the date conversion
      console.log(`Date conversion: ${dateInput} (dd/mm/yyyy) -> ${formattedDate} (yyyy-mm-dd)`);
      
      // Test the conversion
      const testConversion = ValidationService.testDateConversion(dateInput);
      console.log(`Test conversion result: ${testConversion}`);
      
      // Get available slots for this date considering both database and temporary reservations
      if (!userState.selectedDepartment) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          '❌ No department selected. Please start over by typing "book".'
        );
        return;
      }
      
      const department = userState.selectedDepartment as 'Ortho' | 'ENT';
      const availability = await this.getAvailableSlotsWithReservations(formattedDate, department);
      
      // Debug logging
      console.log(`Date: ${formattedDate}, Department: ${department}, Available: ${availability.available.join(', ')}, Booked: ${availability.booked.join(', ')}, Reserved: ${availability.reserved.join(', ')}`);
      
      // Debug: Check database schema to understand time format
      await AppointmentService.debugDatabaseSchema();
      
      if (availability.error) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          `❌ ${availability.error}\n\nPlease try a different date.`
        );
        return;
      }
      
      if (availability.available.length === 0) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          `📅 ${dateInput} (${department})\n\n❌ No available slots for this date and department.\n\nAll time slots are booked. Please choose a different date or type "cancel" to stop.`
        );
        return;
      }

      // Update user state and show available slots as text
      UserStateService.updateUserState(userPhone, {
        selectedDate: formattedDate,
        step: 'waiting_for_slot'
      });
      
      console.log(`Updated user state after date selection:`, userState);
      console.log(`Stored user state:`, UserStateService.getUserState(userPhone));

      await MessageGeneratorService.showAvailableSlotsAsText(userPhone, dateInput, availability.available, department);

    } catch (error) {
      console.error('Error handling date selection:', error);
      await MessageGeneratorService.sendErrorMessage(
        userPhone, 
        '❌ Sorry, there was an error processing your date. Please try again or type "cancel" to start over.'
      );
    }
  }

  // Handle slot selection
  static async handleSlotSelection(userPhone: string, slotInput: string, userState: UserBookingState): Promise<void> {
    try {
      console.log(`Handling slot selection for ${userPhone}: "${slotInput}"`);
      console.log(`User state at start of slot selection:`, userState);
      
      // Parse flexible time input (accepts both 12-hour and 24-hour formats)
      const parsedSlot = parseFlexibleTimeInput(slotInput);
      
      if (!parsedSlot) {
        // Convert time slots to 12-hour format for display
        const formattedSlots = this.formatTimeSlotsTo12Hour(AVAILABLE_TIME_SLOTS);
        const slotsText = formattedSlots.join(', ');
        
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          `❌ Invalid time format: "${slotInput}".\n\nPlease type a time in any of these formats:\n• 10:30 (assumes AM)\n• 1:30 (assumes PM)\n• 10:30 AM or 1:30 PM\n• 13:30 (24-hour format)\n\nAvailable slots: ${slotsText}`
        );
        return;
      }
      
      // Check if the parsed slot is in our available slots
      if (!AVAILABLE_TIME_SLOTS.includes(parsedSlot)) {
        // Convert time slots to 12-hour format for display
        const formattedSlots = this.formatTimeSlotsTo12Hour(AVAILABLE_TIME_SLOTS);
        const slotsText = formattedSlots.join(', ');
        
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          `❌ Time "${slotInput}" (${parsedSlot}) is not available.\n\nPlease choose from these available slots: ${slotsText}`
        );
        return;
      }

      // Immediately check if the slot is still available in the database
      const currentAvailability = await AppointmentService.getAvailableSlotsForDate(userState.selectedDate!, userState.selectedDepartment!);
      
      if (currentAvailability.error) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          `❌ Sorry, there was an error checking slot availability. Please try again or type "cancel" to start over.`
        );
        return;
      }

      // Check if the slot is still available in the database
      if (!currentAvailability.available.includes(parsedSlot)) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          `❌ Sorry, the slot ${parsedSlot} is no longer available. It may have been booked by another user.\n\nPlease choose a different time slot from the available options.`
        );
        return;
      }

      // Check if slot is already reserved by another user
      const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${parsedSlot}`;
      
      if (UserStateService.isSlotReservedByOther(reservationKey, userPhone)) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          `❌ Sorry, the slot ${parsedSlot} was just reserved by another user. Please choose a different time slot.`
        );
        return;
      }

      // Reserve this slot for this user
      UserStateService.addTemporaryReservation(reservationKey, userPhone);
      
      // Update user state
      UserStateService.updateUserState(userPhone, {
        selectedSlot: parsedSlot,
        step: 'waiting_for_details',
        reservationTime: Date.now()
      });
      
      console.log(`Updated user state after slot selection:`, userState);
      console.log(`Stored user state:`, UserStateService.getUserState(userPhone));

      // Ask for patient details
      await MessageGeneratorService.askForPatientDetails(userPhone, userState.selectedDate!, parsedSlot, userState.selectedDepartment!);

    } catch (error) {
      console.error('Error handling slot selection:', error);
      await MessageGeneratorService.sendErrorMessage(
        userPhone, 
        '❌ Sorry, there was an error processing your slot selection. Please try again or type "cancel" to start over.'
      );
    }
  }





  // Handle patient details
  static async handlePatientDetails(userPhone: string, messageText: string, userState: UserBookingState): Promise<void> {
    try {
      console.log(`Handling patient details for ${userPhone}: "${messageText}"`);
      
      let patientName: string;
      let phoneNumber: string;
      
      // Parse patient details from message
      if (messageText.includes('\n')) {
        // Line by line format
        const lines = messageText.split('\n');
        const nameLine = lines.find(line => line.toLowerCase().includes('name:'));
        const phoneLine = lines.find(line => line.toLowerCase().includes('phone:'));
        
        if (nameLine && phoneLine) {
          patientName = nameLine.split(':')[1]?.trim() || '';
          phoneNumber = phoneLine.split(':')[1]?.trim() || '';
        } else {
          throw new Error('Invalid line format');
        }
      } else if (messageText.includes(',')) {
        // Comma separated format
        const parts = messageText.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          patientName = parts[0];
          phoneNumber = parts[1];
        } else {
          throw new Error('Invalid comma format');
        }
      } else {
        throw new Error('Invalid format');
      }
      
      // Validate inputs
      if (!patientName || patientName.length < 2) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          '❌ Please provide a valid patient name (at least 2 characters).'
        );
        return;
      }
      
      if (!phoneNumber || phoneNumber.length < 10) {
        await MessageGeneratorService.sendErrorMessage(
          userPhone, 
          '❌ Please provide a valid phone number (at least 10 digits).'
        );
        return;
      }
      
      // Store patient details
      UserStateService.updateUserState(userPhone, {
        tempData: {
          patientName,
          phoneNumber,
          department: userState.selectedDepartment
        }
      });
      
      // Create appointment directly
      await this.createAppointment(userPhone, userState);
      
    } catch (error) {
      console.error('Error handling patient details:', error);
      await MessageGeneratorService.sendErrorMessage(
        userPhone, 
        '❌ Please provide patient details in the correct format:\n\n📝 Line by line:\nPatient Name: John Doe\nPhone: 1234567890\n\nOR\n\n📝 Comma separated:\nJohn Doe, 1234567890'
      );
    }
  }

  // Create appointment
  private static async createAppointment(userPhone: string, userState: UserBookingState): Promise<void> {
    try {
      if (!userState.selectedDate || !userState.selectedSlot || !userState.selectedDepartment || !userState.tempData) {
        throw new Error('Missing required appointment data');
      }
      
      const appointmentData = {
        patientName: userState.tempData.patientName!,
        patientPhone: userState.tempData.phoneNumber!,
        department: userState.selectedDepartment,
        date: userState.selectedDate,
        timeSlot: userState.selectedSlot
      };
      
      console.log('Creating appointment with data:', appointmentData);
      
      // Create appointment in database
      const result = await AppointmentService.createAppointment(appointmentData);
      
      if (result.success) {
        // Clear temporary reservation
        const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${userState.selectedSlot}`;
        UserStateService.deleteTemporaryReservation(reservationKey);
        
        // Clear user state
        UserStateService.deleteUserState(userPhone);
        
        // Send confirmation message
        const confirmationMessage = `✅ *Appointment Confirmed!*\n\n📋 **Patient:** ${appointmentData.patientName}\n🏥 **Department:** ${this.getDisplayDepartmentName(appointmentData.department)}\n📅 **Date:** ${userState.selectedDate}\n⏰ **Time:** ${appointmentData.timeSlot}\n📱 **Phone:** ${appointmentData.patientPhone}\n\n💰 **Slot Booking Fee:** ₹50 (to be paid at clinic)\n\n📍 **Location:** Orent Clinic, Chengannur, Kerala\n\nThank you for choosing Orent Clinic! 🏥`;
        
        await WhatsAppService.sendMessage(
          WhatsAppService.createTextMessage(userPhone, confirmationMessage)
        );
        
      } else {
        throw new Error(result.error || 'Failed to create appointment');
      }
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      // Clear temporary reservation on error
      if (userState.selectedDate && userState.selectedSlot && userState.selectedDepartment) {
        const reservationKey = `${userState.selectedDate}-${userState.selectedDepartment}-${userState.selectedSlot}`;
        UserStateService.deleteTemporaryReservation(reservationKey);
      }
      
      await MessageGeneratorService.sendErrorMessage(
        userPhone, 
        '❌ Sorry, there was an error creating your appointment. Please call us at 934 934 5538 for assistance.'
      );
    }
  }

  // Get available slots with reservations
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

  // Helper function to convert time slots to 12-hour format
  private static formatTimeSlotsTo12Hour(timeSlots: string[]): string[] {
    return timeSlots.map(slot => this.formatTimeTo12Hour(slot));
  }

  // Helper function to convert time to 12-hour format
  private static formatTimeTo12Hour(time: string): string {
    // Simple conversion for common time formats
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      if (hour === 0) return `12:${minutes} AM`;
      if (hour < 12) return `${hour}:${minutes} AM`;
      if (hour === 12) return `12:${minutes} PM`;
      return `${hour - 12}:${minutes} PM`;
    }
    return time;
  }

  // Helper function to convert internal department names to user-friendly names
  private static getDisplayDepartmentName(department: 'Ortho' | 'ENT'): string {
    return department === 'Ortho' ? 'Orthopedics' : department;
  }
} 