export interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  patientName: string;
  department: 'Ortho' | 'ENT';
  patientPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  date: string;
  timeSlot: string;
  patientName: string;
  department: 'Ortho' | 'ENT';
  patientPhone: string;
}

export interface UpdateAppointmentRequest {
  date?: string;
  timeSlot?: string;
  patientName?: string;
  department?: 'Ortho' | 'ENT';
  patientPhone?: string;
} 