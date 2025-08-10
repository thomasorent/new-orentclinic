import type { Handler } from '@netlify/functions';
import { pool, initializeDatabase } from '../../src/config/database';

interface Appointment {
  id: number;
  date: string;
  timeSlot: string;
  patientName: string;
  department: 'Ortho' | 'ENT';
  patientPhone: string;
  createdAt: string;
  updatedAt: string;
}

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

// Build WHERE clause for filtering
function buildWhereClause(query: Record<string, string>): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (query.department) {
    conditions.push(`department = $${paramIndex++}`);
    params.push(query.department);
  }

  if (query.date) {
    conditions.push(`date = $${paramIndex++}`);
    params.push(query.date);
  }

  if (query.phone) {
    conditions.push(`patient_phone = $${paramIndex++}`);
    params.push(query.phone);
  }

  if (query.upcoming === 'true') {
    conditions.push(`(date > CURRENT_DATE OR (date = CURRENT_DATE AND time_slot > CURRENT_TIME))`);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

export const handler: Handler = async (event, context) => {
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
        const client = await pool.connect();
        
        try {
          const result = await client.query(
            'SELECT * FROM appointments WHERE id = $1',
            [id]
          );
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Appointment not found' }),
            };
          }

          return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(result.rows[0]),
          };
        } finally {
          client.release();
        }
      } else {
        // Get all appointments with optional filtering
        const queryParams = event.queryStringParameters || {};
        const { clause, params } = buildWhereClause(queryParams as Record<string, string>);
        
        const client = await pool.connect();
        try {
          const query = `SELECT * FROM appointments ${clause} ORDER BY date ASC, time_slot ASC`;
          const result = await client.query(query, params);

          return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(result.rows),
          };
        } finally {
          client.release();
        }
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

      const client = await pool.connect();
      try {
        const result = await client.query(
          `INSERT INTO appointments (date, time_slot, patient_name, department, patient_phone)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [body.date, body.timeSlot, body.patientName, body.department, body.patientPhone]
        );

        return {
          statusCode: 201,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(result.rows[0]),
        };
      } finally {
        client.release();
      }
    }

    // PUT - Update appointment
    if (event.httpMethod === 'PUT') {
      const id = event.path.split('/').pop();
      const updateData: UpdateAppointmentRequest = JSON.parse(event.body || '{}');
      
      const client = await pool.connect();
      try {
        // Build dynamic update query
        const updateFields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (updateData.date !== undefined) {
          updateFields.push(`date = $${paramIndex++}`);
          params.push(updateData.date);
        }
        if (updateData.timeSlot !== undefined) {
          updateFields.push(`time_slot = $${paramIndex++}`);
          params.push(updateData.timeSlot);
        }
        if (updateData.patientName !== undefined) {
          updateFields.push(`patient_name = $${paramIndex++}`);
          params.push(updateData.patientName);
        }
        if (updateData.department !== undefined) {
          updateFields.push(`department = $${paramIndex++}`);
          params.push(updateData.department);
        }
        if (updateData.patientPhone !== undefined) {
          updateFields.push(`patient_phone = $${paramIndex++}`);
          params.push(updateData.patientPhone);
        }

        if (updateFields.length === 0) {
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No fields to update' }),
          };
        }

        params.push(id);
        const query = `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
        
        const result = await client.query(query, params);
        
        if (result.rowCount === 0) {
          return {
            statusCode: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Appointment not found' }),
          };
        }

        // Get updated appointment
        const updatedResult = await client.query(
          'SELECT * FROM appointments WHERE id = $1',
          [id]
        );

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedResult.rows[0]),
        };
      } finally {
        client.release();
      }
    }

    // DELETE - Delete appointment
    if (event.httpMethod === 'DELETE') {
      const id = event.path.split('/').pop();
      
      const client = await pool.connect();
      try {
        const result = await client.query(
          'DELETE FROM appointments WHERE id = $1',
          [id]
        );
        
        if (result.rowCount === 0) {
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
      } finally {
        client.release();
      }
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