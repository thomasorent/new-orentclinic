# WhatsApp Webhook Setup Guide

This guide will help you set up the WhatsApp Business API webhook for Orent Clinic to handle incoming messages and send interactive responses.

## Prerequisites

1. A Meta Developer Account
2. A WhatsApp Business Account
3. A Netlify account with your project deployed

## Step 1: Set up Meta Developer Account

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the "WhatsApp" product to your app

## Step 2: Configure WhatsApp Business API

1. In your Meta app, go to WhatsApp > Getting Started
2. Add your phone number
3. Note down your **Phone Number ID** (you'll need this for the environment variable)
4. Generate a **Permanent Access Token** (this is your `WHATSAPP_TOKEN`)

## Step 3: Set Environment Variables

Add these environment variables to your Netlify deployment:

```bash
WHATSAPP_TOKEN=your_permanent_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
```

**Important Notes:**
- `WHATSAPP_TOKEN`: The permanent access token from Meta
- `WHATSAPP_PHONE_NUMBER_ID`: The phone number ID from your WhatsApp Business account
- `WHATSAPP_VERIFY_TOKEN`: Any custom string you choose (used for webhook verification)

## Step 4: Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set the environment variables in Netlify's dashboard
4. Deploy your site

## Step 5: Configure Webhook URL

1. In your Meta app, go to WhatsApp > Configuration
2. Set the **Webhook URL** to: `https://your-site.netlify.app/.netlify/functions/whatsapp-webhook`
3. Set the **Verify Token** to match your `WHATSAPP_VERIFY_TOKEN` environment variable
4. Subscribe to the `messages` field

## Step 6: Test the Webhook

1. Send a message to your WhatsApp Business number
2. You should receive an automatic welcome message with two interactive buttons:
   - 🦴 Ortho Appointment
   - 👂 ENT Appointment

## How It Works

1. **Webhook Verification**: When Meta tries to verify your webhook, it sends a GET request with verification parameters
2. **Message Handling**: When users send messages, Meta sends POST requests with message data
3. **Automatic Response**: The webhook automatically sends a welcome message with interactive buttons
4. **Interactive Buttons**: Users can tap the buttons to select appointment types

## Troubleshooting

### Common Issues:

1. **Webhook verification fails**: Check that your `WHATSAPP_VERIFY_TOKEN` matches exactly
2. **Messages not sending**: Verify your `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are correct
3. **CORS errors**: The webhook handles this automatically
4. **Rate limiting**: WhatsApp has rate limits; the webhook includes error handling

### Debugging:

- Check Netlify function logs in your dashboard
- Verify environment variables are set correctly
- Ensure your webhook URL is accessible from the internet

## Security Considerations

- Keep your `WHATSAPP_TOKEN` secure and never commit it to version control
- Use environment variables for all sensitive configuration
- The webhook includes proper validation of incoming requests
- Consider implementing additional authentication if needed

## Next Steps

To extend this webhook, you can:

1. Handle button responses (when users tap Ortho or ENT buttons)
2. Integrate with your appointment booking system
3. Add more interactive elements like quick replies
4. Implement conversation flow management
5. Add analytics and logging

## Support

If you encounter issues:
1. Check the Meta Developer documentation
2. Review Netlify function logs
3. Verify all environment variables are set correctly
4. Ensure your webhook URL is publicly accessible 