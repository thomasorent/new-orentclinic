import type { WhatsAppResponse } from "../types/whatsapp";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export class WhatsAppService {
  static async sendMessage(message: WhatsAppResponse): Promise<void> {
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

  static createTextMessage(recipientPhone: string, body: string): WhatsAppResponse {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'text',
      text: { body }
    };
  }

  static createInteractiveMessage(recipientPhone: string, bodyText: string, buttons: any[]): WhatsAppResponse {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons }
      }
    };
  }
} 