export interface WhatsAppMessage {
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

export interface WhatsAppResponse {
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