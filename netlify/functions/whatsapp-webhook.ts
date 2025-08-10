import type { Handler } from '@netlify/functions';
import { pool, initializeDatabase } from '../../src/config/database';

interface WhatsAppMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
      };
    }>;
  }>;
}

interface WhatsAppResponse {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  interactive?: {
    type: string;
    body: {
      text: string;
    };
    action: {
      buttons: Array<{
        type: string;
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
  text?: {
    body: string;
  };
}

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Initialize database on first run
let dbInitialized = false;

async function ensureDatabaseInitialized(): Promise<void> {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export const handler: Handler = async (event, context) => {
  // Handle webhook verification
  if (event.httpMethod === 'GET') {
    const queryParams = new URLSearchParams(event.queryStringParameters as Record<string, string> || '');
    const mode = queryParams.get('hub.mode');
    const token = queryParams.get('hub.verify_token');
    const challenge = queryParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return {
        statusCode: 200,
        body: challenge || '',
      };
    }

    return {
      statusCode: 403,
      body: 'Forbidden',
    };
  }

  // Handle incoming messages
  if (event.httpMethod === 'POST') {
    try {
      await ensureDatabaseInitialized();
      
      const body: WhatsAppMessage = JSON.parse(event.body || '{}');

      // Verify this is a WhatsApp message
      if (body.object !== 'whatsapp_business_account') {
        return {
          statusCode: 400,
          body: 'Invalid object type',
        };
      }

      // Process each entry
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messaging_product === 'whatsapp') {
            const messages = change.value.messages;
            
            if (messages && messages.length > 0) {
              for (const message of messages) {
                if (message.type === 'text') {
                  await handleIncomingMessage(message);
                }
              }
            }
          }
        }
      }

      return {
        statusCode: 200,
        body: 'OK',
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        statusCode: 500,
        body: 'Internal server error',
      };
      }
    }

  return {
    statusCode: 405,
    body: 'Method not allowed',
  };
};

// Read appointments from database
async function readAppointments(): Promise<any[]> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM appointments ORDER BY time_slot ASC');
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error reading appointments from database:', error);
    return [];
  }
}

// Handle incoming WhatsApp messages
async function handleIncomingMessage(message: any): Promise<void> {
  const userPhone = message.from;
  const messageText = message.text?.body?.toLowerCase() || '';

  // Check if user has existing appointments
  const appointments = await readAppointments();
  const userAppointments = appointments.filter(apt => apt.patientPhone === userPhone);

  if (messageText.includes('book') || messageText.includes('appointment') || messageText.includes('schedule')) {
    await sendAppointmentForm(userPhone);
  } else if (messageText.includes('my appointments') || messageText.includes('check')) {
    await sendUserAppointments(userPhone, userAppointments);
  } else if (messageText.includes('help')) {
    await sendHelpMessage(userPhone);
  } else {
    await sendWelcomeMessage(userPhone);
  }
}

async function sendAppointmentForm(recipientPhone: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return;

  const message: WhatsAppResponse = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'text',
    text: {
      body: '📅 Appointment Booking\n\nPlease provide the following information:\n\n1️⃣ Patient Name:\n2️⃣ Department (Ortho/ENT):\n3️⃣ Preferred Date & Time:\n4️⃣ Phone Number:\n\nReply with all details in one message.',
    },
  };

  await sendWhatsAppMessage(message);
}

async function sendUserAppointments(recipientPhone: string, appointments: any[]): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return;

  if (appointments.length === 0) {
    const message: WhatsAppResponse = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'text',
      text: {
        body: '📋 You have no appointments scheduled.\n\nReply with "book appointment" to schedule one!',
      },
    };
    await sendWhatsAppMessage(message);
    return;
  }

  let appointmentText = '📋 Your Appointments:\n\n';
  appointments.forEach((apt, index) => {
    const date = apt.date;
    const time = apt.timeSlot;
    
    appointmentText += `${index + 1}. ${apt.patientName}\n`;
    appointmentText += `   📅 ${date} at ${time}\n`;
    appointmentText += `   🏥 ${apt.department}\n\n`;
  });

  const message: WhatsAppResponse = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'text',
    text: {
      body: appointmentText,
    },
  };

  await sendWhatsAppMessage(message);
}

async function sendHelpMessage(recipientPhone: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return;

  const message: WhatsAppResponse = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'text',
    text: {
      body: '❓ How can we help?\n\nAvailable commands:\n\n📅 "book appointment" - Schedule new appointment\n📋 "my appointments" - View your appointments\n❓ "help" - Show this help message\n\nFor urgent matters, please call our clinic directly.',
    },
  };

  await sendWhatsAppMessage(message);
}

async function sendWhatsAppMessage(message: WhatsAppResponse): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error('Missing WhatsApp configuration');
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send WhatsApp message:', response.status, errorText);
    } else {
      console.log('WhatsApp message sent successfully');
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

async function sendWelcomeMessage(recipientPhone: string): Promise<void> {
  const welcomeMessage: WhatsAppResponse = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'text',
    text: {
      body: 'Welcome to Orent Clinic! 🏥\n\nWe\'re here to help you with your healthcare needs. Please reply with:\n\n📅 "book appointment" - to schedule a new appointment\n📋 "my appointments" - to check your existing appointments\n❓ "help" - for assistance',
    },
  };

  await sendWhatsAppMessage(welcomeMessage);
}
