import type { Handler } from '@netlify/functions';
import { supabase, initializeDatabase } from '../../src/config/database';

// Appointment interface is defined in types/appointment.ts

interface CreateAppointmentRequest {
  date: string;
  timeSlot: string;
  patientName: string;
  department: 'Ortho' | 'ENT';
  patientPhone: string;
}

interface UpdateAppointmentRequest {
  date?: string;
  timeSlot?: string;
  patientName?: string;
  department?: 'Ortho' | 'ENT';
  patientPhone?: string;
}

// Initialize database on first run
let dbInitialized = false;

async function ensureDatabaseInitialized(): Promise<void> {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

// Build filter for Supabase queries
function buildFilter(query: Record<string, string>): any {
  const filter: any = {};

  if (query.department) {
    filter.department = query.department;
  }

  if (query.date) {
    filter.date = query.date;
  }

  if (query.phone) {
    filter.patient_phone = query.phone;
  }

  return filter;
}

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    await ensureDatabaseInitialized();

    // GET - Retrieve appointments
    if (event.httpMethod === 'GET') {
      if (event.path.includes('/appointments/')) {
        // Get specific appointment by ID
        const id = event.path.split('/').pop();
        
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error || !data) {
          return {
            statusCode: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Appointment not found' }),
          };
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        };
      } else {
        // Get all appointments with optional filtering
        const queryParams = event.queryStringParameters || {};
        const filter = buildFilter(queryParams as Record<string, string>);
        
        let query = supabase
          .from('appointments')
          .select('*')
          .order('date', { ascending: true })
          .order('time_slot', { ascending: true });

        // Apply filters
        if (filter.department) {
          query = query.eq('department', filter.department);
        }
        if (filter.date) {
          query = query.eq('date', filter.date);
        }
        if (filter.patient_phone) {
          query = query.eq('patient_phone', filter.patient_phone);
        }
        if (queryParams.upcoming === 'true') {
          query = query.gt('date', new Date().toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching appointments:', error);
          return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch appointments' }),
          };
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(data || []),
        };
      }
    }

    // POST - Create new appointment
    if (event.httpMethod === 'POST') {
      const body: CreateAppointmentRequest = JSON.parse(event.body || '{}');
      
      // Validate required fields
      if (!body.date || !body.timeSlot || !body.patientName || !body.department || !body.patientPhone) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          date: body.date,
          time_slot: body.timeSlot,
          patient_name: body.patientName,
          department: body.department,
          patient_phone: body.patientPhone,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        return {
          statusCode: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Failed to create appointment' }),
        };
      }

      return {
        statusCode: 201,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    // PUT - Update appointment
    if (event.httpMethod === 'PUT') {
      const id = event.path.split('/').pop();
      const updateData: UpdateAppointmentRequest = JSON.parse(event.body || '{}');
      
      // Build update object
      const updateFields: any = {};
      if (updateData.date !== undefined) updateFields.date = updateData.date;
      if (updateData.timeSlot !== undefined) updateFields.time_slot = updateData.timeSlot;
      if (updateData.patientName !== undefined) updateFields.patient_name = updateData.patientName;
      if (updateData.department !== undefined) updateFields.department = updateData.department;
      if (updateData.patientPhone !== undefined) updateFields.patient_phone = updateData.patientPhone;

      if (Object.keys(updateFields).length === 0) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'No fields to update' }),
        };
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Appointment not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    // DELETE - Delete appointment
    if (event.httpMethod === 'DELETE') {
      const id = event.path.split('/').pop();
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Appointment not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Appointment deleted successfully' }),
      };
    }

    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error handling appointment request:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}; 