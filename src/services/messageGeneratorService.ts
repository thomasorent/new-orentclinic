// Message generator service
// Handles all WhatsApp message creation and templates

import { WhatsAppService } from './whatsappService';
import { ValidationService } from './validationService';

export class MessageGeneratorService {
  // Send welcome message
  static async sendWelcomeMessage(recipientPhone: string): Promise<void> {
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      'Welcome to Orent Clinic! 🏥\n\nWe\'re here to help you with your healthcare needs.\n\n📅 Appointments are available on weekdays (Monday to Friday) only.\n\nPlease reply with:\n\n📅 "book" - to start the step-by-step booking process (Department → Date → Time → Details)\n📋 "my appointments" - to check your existing appointments\n📊 "weekly" - to see weekly availability overview for both departments\n❓ "help" - for assistance'
    );
    await WhatsAppService.sendMessage(message);
  }

  // Send help message
  static async sendHelpMessage(recipientPhone: string): Promise<void> {
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      '❓ How can we help?\n\nAvailable commands:\n\n📅 "book" - Start step-by-step booking process (Department → Date → Time → Details)\n📋 "my appointments" - View your appointments\n📊 "weekly" - Show weekly availability overview for both departments\n❓ "help" - Show this help message\n\n📝 Note: Appointments are only available on weekdays (Monday to Friday) during clinic hours.\n\nFor urgent matters, please call our clinic directly.'
    );
    await WhatsAppService.sendMessage(message);
  }

  // Send booking information and ask for confirmation
  static async sendBookingInfo(recipientPhone: string): Promise<void> {
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      '📋 *Booking Information & Rules*\n\n' +
      'Before we proceed with your appointment booking, please note the following:\n\n' +
      '💰 *Slot Booking Fee:* ₹50 for every appointment (new or review)\n\n' +
      '⏰ *Today\'s Booking:* Only open until 9:00 AM. After that, please call reception for availability.\n\n' +
      '📅 *Future Bookings:* Allowed up to 7 days in advance\n\n' +
      '✅ *Confirmation:* Slot is confirmed only after payment (no provisional holding)\n\n' +
      'Do you want to continue with the booking process?\n\n' +
      'Reply with:\n' +
      '• "yes" or "continue" - to proceed\n' +
      '• "cancel" - to stop the booking process'
    );
    await WhatsAppService.sendMessage(message);
  }

  // Ask user for department selection
  static async askForDepartment(recipientPhone: string): Promise<void> {
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      '🏥 Please select your department:\n\n1️⃣ Orthopedics\n2️⃣ ENT\n\nType "1" for Orthopedics or "2" for ENT.\nType "cancel" to stop the booking process.'
    );
    await WhatsAppService.sendMessage(message);
  }

  // Ask user for date selection
  static async askForDate(recipientPhone: string, department: 'Ortho' | 'ENT'): Promise<void> {
    const displayDepartment = this.getDisplayDepartmentName(department);
    
    // Calculate and format the maximum advance booking date
    const maxAdvanceDate = ValidationService.calculateMaxAdvanceDate(7);
    const maxDateFormatted = maxAdvanceDate.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `📅 Let's book your appointment for ${displayDepartment}!\n\nPlease provide the date you'd like to book in dd/mm/yyyy format (e.g., 25/12/2024).\n\n📋 *Booking Rules:*\n• Weekdays only (Monday to Friday)\n• Maximum 7 weekdays in advance\n• Latest available date: ${maxDateFormatted}\n\nType "cancel" to stop the booking process.`
    );
    await WhatsAppService.sendMessage(message);
  }

  // Show available slots as text
  static async showAvailableSlotsAsText(recipientPhone: string, date: string, availableSlots: string[], department: 'Ortho' | 'ENT'): Promise<void> {
    // Convert time slots to 12-hour format for display
    const formattedSlots = this.formatTimeSlotsTo12Hour(availableSlots);
    const slotsText = formattedSlots.join(', ');
    const displayDepartment = this.getDisplayDepartmentName(department);
    
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `📅 Available slots for ${date} (${displayDepartment}):\n\n⏰ ${slotsText}\n\nPlease type your preferred time slot in any format:\n• 10:30 (assumes AM)\n• 1:30 (assumes PM)\n• 10:30 AM or 1:30 PM\n• 13:30 (24-hour format)\n\n⚠️ Note: Slots are checked for availability when you select them.`
    );

    await WhatsAppService.sendMessage(message);
  }

  // Ask for patient details
  static async askForPatientDetails(recipientPhone: string, date: string, time: string, department: 'Ortho' | 'ENT'): Promise<void> {
    const displayDepartment = this.getDisplayDepartmentName(department);
    // Convert time to 12-hour format for display
    const formattedTime = this.formatTimeTo12Hour(time);
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `📋 Great! You've selected ${date} at ${formattedTime} for ${displayDepartment}.\n\nNow please provide:\n\n1️⃣ Patient Name:\n2️⃣ Phone Number:\n\nYou can reply in two formats:\n\n📝 Line by line:\nPatient Name: John Doe\nPhone: 1234567890\n\nOR\n\n📝 Comma separated:\nJohn Doe, 1234567890\n\nType "cancel" to start over.`
    );
    await WhatsAppService.sendMessage(message);
  }

  // Send payment step message
  static async sendPaymentStepMessage(recipientPhone: string, date: string, time: string, department: 'Ortho' | 'ENT', patientName: string): Promise<void> {
    const displayDepartment = this.getDisplayDepartmentName(department);
    const formattedTime = this.formatTimeTo12Hour(time);
    
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `💳 **Payment Step**\n\nWe are now proceeding to payment for your appointment.\n\n📋 **Appointment Details:**\n👤 Patient: ${patientName}\n🏥 Department: ${displayDepartment}\n📅 Date: ${date}\n⏰ Time: ${formattedTime}\n💰 Fee: ₹50 (Slot Booking Fee)\n\nPlease confirm that you want to proceed with payment by typing:\n\n✅ "pay" or "confirm" - to proceed with payment\n❌ "cancel" - to cancel the booking`
    );
    await WhatsAppService.sendMessage(message);
  }

  // Send payment button message
  static async sendPaymentButtonMessage(recipientPhone: string, date: string, time: string, department: 'Ortho' | 'ENT', _patientName: string): Promise<void> {
    const formattedTime = this.formatTimeTo12Hour(time);
    const doctor = this.getDoctorName(department);
    
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `⏰ **Slot Reserved for 15 Minutes**\n\nYour appointment with ${doctor} on ${date} at ${formattedTime} is reserved for 15 minutes.\n\nTap "Pay now" to confirm your booking.`
    );
    await WhatsAppService.sendMessage(message);
    
    // Send interactive button with Razorpay link
    await this.sendPaymentButton(recipientPhone);
  }

  // Send payment button
  private static async sendPaymentButton(recipientPhone: string): Promise<void> {
    // Create Razorpay payment link
    const razorpayLink = await this.createRazorpayPaymentLink(recipientPhone);
    
    // Send interactive button message
    const buttonMessage = WhatsAppService.createInteractiveMessage(
      recipientPhone,
      '💳 Complete Your Payment\n\nClick the button below to proceed with payment:',
      [
        {
          type: 'url',
          text: 'Pay Now',
          url: razorpayLink
        }
      ]
    );
    
    await WhatsAppService.sendMessage(buttonMessage);
  }

  // Send payment timeout message
  static async sendPaymentTimeoutMessage(recipientPhone: string): Promise<void> {
    const message = WhatsAppService.createTextMessage(
      recipientPhone,
      `⏰ **Booking Cancelled**\n\nYour 15-minute payment window has expired and the slot has been released.\n\nTo book a new appointment, please type "book" to start over.`
    );
    await WhatsAppService.sendMessage(message);
  }

  // Create Razorpay payment link
  private static async createRazorpayPaymentLink(recipientPhone: string): Promise<string> {
    // This would typically call your backend to create a Razorpay order
    // For now, returning a placeholder link
    const baseUrl = 'https://api.razorpay.com/v1/checkout/embedded';
    const orderId = `order_${Date.now()}_${recipientPhone}`;
    
    // In production, you would:
    // 1. Call your backend to create a Razorpay order
    // 2. Get the actual payment link from Razorpay
    // 3. Return the real payment URL
    
    return `${baseUrl}?order_id=${orderId}&amount=5000&currency=INR&prefill[contact]=${recipientPhone}`;
  }

  // Get doctor name for display
  private static getDoctorName(department: 'Ortho' | 'ENT'): string {
    return department === 'Ortho' ? 'Dr. K. M. Thomas' : 'Dr. Susan Thomas';
  }

  // Send weekly availability
  static async sendWeeklyAvailability(recipientPhone: string, availabilityData: any): Promise<void> {
    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(recipientPhone, availabilityData)
    );
  }

  // Send user appointments
  static async sendUserAppointments(recipientPhone: string, appointments: any): Promise<void> {
    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(recipientPhone, appointments)
    );
  }

  // Send error message
  static async sendErrorMessage(recipientPhone: string, errorMessage: string): Promise<void> {
    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(recipientPhone, errorMessage)
    );
  }

  // Send cancellation message
  static async sendCancellationMessage(recipientPhone: string): Promise<void> {
    await WhatsAppService.sendMessage(
      WhatsAppService.createTextMessage(recipientPhone, '❌ Booking cancelled. You can start over by typing "book" anytime.')
    );
  }

  // Helper function to convert internal department names to user-friendly names
  private static getDisplayDepartmentName(department: 'Ortho' | 'ENT'): string {
    return department === 'Ortho' ? 'Orthopedics' : department;
  }

  // Helper function to convert time slots to 12-hour format
  private static formatTimeSlotsTo12Hour(timeSlots: string[]): string[] {
    return timeSlots.map(slot => this.formatTimeTo12Hour(slot));
  }

  // Helper function to convert time to 12-hour format
  private static formatTimeTo12Hour(time: string): string {
    // Simple conversion for common time formats
    // This is a basic implementation - you might want to use a proper time utility
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
} 