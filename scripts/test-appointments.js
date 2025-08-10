import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppointments() {
  try {
    console.log('=== Testing Appointments Database ===');
    
    // Test database connection
    const { error: connectionError } = await supabase
      .from('appointments')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('Database connection error:', connectionError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Get all appointments
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching appointments:', error);
      return;
    }
    
    console.log(`\n📋 Total appointments in database: ${appointments?.length || 0}`);
    
    if (appointments && appointments.length > 0) {
      console.log('\n=== Appointment Details ===');
      appointments.forEach((apt, index) => {
        console.log(`${index + 1}. Date: ${apt.date} (${typeof apt.date})`);
        console.log(`   Time: ${apt.time_slot} (${typeof apt.time_slot})`);
        console.log(`   Patient: ${apt.patient_name}`);
        console.log(`   Phone: ${apt.patient_phone} (${typeof apt.patient_phone})`);
        console.log(`   Department: ${apt.department}`);
        console.log(`   Created: ${apt.created_at}`);
        console.log('');
      });
      
      // Test phone number normalization
      console.log('=== Phone Number Test ===');
      const testPhone = '1234567890';
      const normalizedTest = testPhone.replace(/\D/g, '');
      console.log(`Test phone: ${testPhone} -> Normalized: ${normalizedTest}`);
      
      // Test date parsing
      console.log('\n=== Date Parsing Test ===');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log(`Today (start of day): ${today.toISOString()}`);
      console.log(`Today (local): ${today.toLocaleDateString()}`);
      
      if (appointments.length > 0) {
        const firstAppointment = appointments[0];
        const appointmentDate = new Date(firstAppointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        console.log(`First appointment date: ${firstAppointment.date} -> Parsed: ${appointmentDate.toISOString()}`);
        console.log(`Is future: ${appointmentDate >= today}`);
      }
    } else {
      console.log('❌ No appointments found in database');
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testAppointments(); 