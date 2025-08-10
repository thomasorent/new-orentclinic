import React, { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services/appointmentService';
import type { Appointment, CreateAppointmentRequest } from '../types/appointment';
import './AppointmentManager.css';

const AppointmentManager: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [filters, setFilters] = useState({
    department: '',
    date: '',
  });

  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    date: '',
    timeSlot: '',
    patientName: '',
    department: 'Ortho',
    patientPhone: '',
  });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const filteredFilters: Record<string, string> = {};
      if (filters.department) filteredFilters.department = filters.department;
      if (filters.date) filteredFilters.date = filters.date;

      const data = await appointmentService.getAppointments(filteredFilters);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await appointmentService.updateAppointment(editingAppointment.id, formData);
        setEditingAppointment(null);
      } else {
        await appointmentService.createAppointment(formData);
      }
      
      setFormData({
        date: '',
        timeSlot: '',
        patientName: '',
        department: 'Ortho',
        patientPhone: '',
      });
      setShowForm(false);
      loadAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      patientName: appointment.patientName,
      department: appointment.department,
      patientPhone: appointment.patientPhone,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentService.deleteAppointment(id);
        loadAppointments();
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const formatDateTime = (date: string, timeSlot: string) => {
    const dateObj = new Date(date);
    const timeObj = new Date(`2000-01-01T${timeSlot}`);
    
    return `${dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })} at ${timeObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      date: '',
    });
  };

  if (loading) {
    return (
      <div className="appointment-manager">
        <div className="loading">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="appointment-manager">
      <div className="header">
        <h2>Appointment Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'New Appointment'}
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          >
            <option value="">All Departments</option>
            <option value="Ortho">Ortho</option>
            <option value="ENT">ENT</option>
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            placeholder="Filter by date"
          />

          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Appointment Form */}
      {showForm && (
        <div className="appointment-form">
          <h3>{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as 'Ortho' | 'ENT' })}
                  required
                >
                  <option value="Ortho">Ortho</option>
                  <option value="ENT">ENT</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingAppointment ? 'Update' : 'Create'} Appointment
              </button>
              {editingAppointment && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingAppointment(null);
                    setShowForm(false);
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      <div className="appointments-list">
        <h3>Appointments ({appointments.length})</h3>
        {appointments.length === 0 ? (
          <div className="no-appointments">No appointments found</div>
        ) : (
          <div className="appointments-grid">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <span className={`department-badge ${appointment.department.toLowerCase()}`}>
                    {appointment.department}
                  </span>
                </div>

                <div className="appointment-details">
                  <h4>{appointment.patientName}</h4>
                  <p><strong>Phone:</strong> {appointment.patientPhone}</p>
                  <p><strong>Date & Time:</strong> {formatDateTime(appointment.date, appointment.timeSlot)}</p>
                  <p><strong>Created:</strong> {new Date(appointment.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="appointment-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(appointment)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(appointment.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManager; 