import type { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../types/appointment';

class AppointmentService {
  private readonly API_BASE = '/.netlify/functions';

  // Create new appointment
  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    try {
      const response = await fetch(`${this.API_BASE}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create appointment: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Get all appointments
  async getAppointments(filters?: { department?: 'Ortho' | 'ENT'; date?: string }): Promise<Appointment[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.department) queryParams.append('department', filters.department);
      if (filters?.date) queryParams.append('date', filters.date);

      const response = await fetch(`${this.API_BASE}/appointments?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch appointments: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const response = await fetch(`${this.API_BASE}/appointments/${id}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch appointment: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }

  // Update appointment
  async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<Appointment | null> {
    try {
      const response = await fetch(`${this.API_BASE}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update appointment: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Delete appointment
  async deleteAppointment(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/appointments/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete appointment: ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  // Get appointments by phone number (useful for WhatsApp integration)
  async getAppointmentsByPhone(phone: string): Promise<Appointment[]> {
    try {
      const response = await fetch(`${this.API_BASE}/appointments?phone=${encodeURIComponent(phone)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch appointments by phone: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointments by phone:', error);
      throw error;
    }
  }

  // Get upcoming appointments
  async getUpcomingAppointments(): Promise<Appointment[]> {
    try {
      const response = await fetch(`${this.API_BASE}/appointments?upcoming=true`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch upcoming appointments: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  // Get appointments for a specific date
  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    try {
      const response = await fetch(`${this.API_BASE}/appointments?date=${encodeURIComponent(date)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch appointments by date: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointments by date:', error);
      throw error;
    }
  }

  // Get appointments by department
  async getAppointmentsByDepartment(department: 'Ortho' | 'ENT'): Promise<Appointment[]> {
    try {
      const response = await fetch(`${this.API_BASE}/appointments?department=${department}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch appointments by department: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointments by department:', error);
      throw error;
    }
  }
}

export const appointmentService = new AppointmentService(); 