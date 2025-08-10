import type { Handler } from '@netlify/functions';
import { initializeDatabase } from '../../src/config/database';
import type { WhatsAppMessage } from '../../src/types/whatsapp';
import { MessageHandlerService } from '../../src/services/messageHandlerService';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Initialize database on first run
let dbInitialized = false;

async function ensureDatabaseInitialized(): Promise<void> {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export const handler: Handler = async (event) => {
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
                  await MessageHandlerService.handleIncomingMessage(message);
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
