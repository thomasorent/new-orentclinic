export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'timeout';

export interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  patientName: string;
  department: 'Ortho' | 'ENT';
  patientPhone: string;
  paymentStatus: PaymentStatus;
  paymentOrderId?: string;
  paymentAmount: number;
  paymentMethod?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentConfirmedAt?: string;
  bookingFee: number;
  paymentReservationExpiresAt?: string;
  isSlotConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  date: string;
  timeSlot: string;
  patientName: string;
  department: 'Ortho' | 'ENT';
  patientPhone: string;
  paymentOrderId?: string;
  paymentAmount?: number;
  bookingFee?: number;
  paymentReservationExpiresAt?: string;
}

export interface UpdateAppointmentRequest {
  date?: string;
  timeSlot?: string;
  patientName?: string;
  department?: 'Ortho' | 'ENT';
  patientPhone?: string;
  paymentStatus?: PaymentStatus;
  paymentOrderId?: string;
  paymentMethod?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  isSlotConfirmed?: boolean;
}

export interface PaymentConfirmationRequest {
  paymentOrderId: string;
  razorpayPaymentId: string;
  paymentMethod?: string;
} 