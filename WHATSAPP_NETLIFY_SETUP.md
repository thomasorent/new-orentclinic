# WhatsApp API to Netlify Webhook Connection Checklist

## ✅ Prerequisites (Complete these first)
- [ ] Meta Developer Account created
- [ ] WhatsApp Business API product added to your app
- [ ] Phone number verified in WhatsApp Business
- [ ] Netlify site deployed with functions

## 🔑 Step 1: Get WhatsApp API Credentials

### From Meta Developer Console:
1. [ ] Go to [Meta Developers](https://developers.facebook.com/)
2. [ ] Select your app
3. [ ] Navigate to **WhatsApp** → **Getting Started**
4. [ ] Copy your **Phone Number ID** (looks like: 123456789012345)
5. [ ] Generate **Permanent Access Token** (click "Generate Token")
6. [ ] Copy the token (starts with "EAA...")

### Create Verify Token:
1. [ ] Choose a custom verify token (any string you want, e.g., "orent_clinic_2024")
2. [ ] Write it down - you'll need it in multiple places

## 🌐 Step 2: Configure Netlify Environment Variables

### In Netlify Dashboard:
1. [ ] Go to your site's **Site settings**
2. [ ] Click **Environment variables**
3. [ ] Add these variables:

```bash
WHATSAPP_TOKEN=EAA...your_actual_token_here
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=orent_clinic_2024
```

4. [ ] Click **Save**
5. [ ] **Redeploy** your site (important!)

## 🔗 Step 3: Configure WhatsApp Webhook

### In Meta Developer Console:
1. [ ] Go to **WhatsApp** → **Configuration**
2. [ ] Set **Webhook URL**: `https://your-site-name.netlify.app/.netlify/functions/whatsapp-webhook`
3. [ ] Set **Verify Token**: `orent_clinic_2024` (same as your environment variable)
4. [ ] Click **Verify and save**
5. [ ] Subscribe to **messages** field
6. [ ] Click **Save**

## 🧪 Step 4: Test the Connection

### Test 1: Webhook Accessibility
1. [ ] Open: `https://your-site-name.netlify.app/.netlify/functions/whatsapp-webhook`
2. [ ] Should see "Method not allowed" (this is correct!)

### Test 2: Webhook Verification
1. [ ] Run the test script: `node scripts/test-webhook.js`
2. [ ] Update the script with your actual site name and verify token
3. [ ] Should see "✅ Webhook verification successful!"

### Test 3: Send Test Message
1. [ ] Send any message to your WhatsApp Business number
2. [ ] Should receive automatic welcome message
3. [ ] Check Netlify function logs for any errors

## 📋 Step 5: Verify Everything Works

### Check Netlify Function Logs:
1. [ ] Go to **Functions** tab in Netlify dashboard
2. [ ] Click on `whatsapp-webhook` function
3. [ ] Check for any error logs
4. [ ] Verify function is being called when you send WhatsApp messages

### Test Message Flow:
1. [ ] Send "help" to your WhatsApp number
2. [ ] Should receive help message
3. [ ] Send "book appointment"
4. [ ] Should receive appointment form
5. [ ] Send "my appointments"
6. [ ] Should receive appointment list (or "no appointments" message)

## 🚨 Troubleshooting Common Issues

### Webhook Verification Fails:
- [ ] Check `WHATSAPP_VERIFY_TOKEN` matches exactly in both places
- [ ] Ensure environment variables are set and site is redeployed
- [ ] Verify webhook URL is correct

### Messages Not Sending:
- [ ] Check `WHATSAPP_TOKEN` is correct and not expired
- [ ] Verify `WHATSAPP_PHONE_NUMBER_ID` is correct
- [ ] Check Netlify function logs for errors

### Function Not Found:
- [ ] Ensure `netlify/functions/whatsapp-webhook.ts` exists
- [ ] Verify TypeScript compilation is working
- [ ] Check Netlify build logs

## 🎯 Success Indicators

You'll know everything is working when:
- [ ] Webhook verification returns 200 status
- [ ] Sending WhatsApp messages triggers function calls
- [ ] You receive automatic responses to your messages
- [ ] No errors in Netlify function logs
- [ ] Meta Developer Console shows webhook as "Active"

## 🔄 Next Steps After Connection

1. [ ] Test all message flows
2. [ ] Customize welcome messages
3. [ ] Add more interactive features
4. [ ] Set up appointment booking flow
5. [ ] Monitor usage and performance

## 📞 Need Help?

If you're stuck:
1. Check Netlify function logs first
2. Verify all environment variables are set
3. Ensure webhook URL is publicly accessible
4. Check Meta Developer Console for webhook status
5. Review the main `WHATSAPP_SETUP.md` file for detailed explanations 