# AI Chatbot Setup Guide for Orent Clinic

This guide will help you set up and configure the AI-powered chatbot for your medical clinic website.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Basic Setup (Local AI Only)
The chatbot is ready to use with local AI responses. No additional configuration needed!

### 3. Test the Chatbot
```bash
npm run dev
```
Open your browser and look for the chat icon in the bottom-right corner.

## 🤖 AI Configuration Options

### Option 1: Local AI (Default)
- ✅ **Ready to use immediately**
- ✅ **No API costs**
- ✅ **Fast responses**
- ✅ **Works offline**
- ❌ **Limited response variety**

### Option 2: OpenAI Integration (Advanced)
- ✅ **More natural conversations**
- ✅ **Better context understanding**
- ✅ **Highly customizable**
- ❌ **Requires API key**
- ❌ **Monthly costs**

## 🔧 OpenAI Setup (Optional)

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Configure Environment Variables
Create a `.env` file in your project root:
```env
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Enable OpenAI in Configuration
Edit `src/config/chatbotConfig.ts`:
```typescript
openai: {
  enabled: true, // Change this to true
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  // ... other settings
}
```

## 📁 File Structure

```
src/
├── components/
│   ├── Chatbot.tsx          # Main chatbot component
│   └── Chatbot.css          # Chatbot styling
├── services/
│   └── aiService.ts         # AI logic and API integration
├── config/
│   └── chatbotConfig.ts     # Configuration settings
└── App.tsx                  # Main app (updated with chatbot)
```

## 🎨 Customization

### 1. Styling
Edit `src/components/Chatbot.css` to match your clinic's branding:
- Colors
- Fonts
- Layout
- Animations

### 2. Responses
Edit `src/services/aiService.ts` to customize:
- Welcome message
- Common responses
- Knowledge base
- Error messages

### 3. Configuration
Edit `src/config/chatbotConfig.ts` to adjust:
- UI position
- Theme
- Features
- Clinic information

## 🧠 Knowledge Base

The chatbot is pre-configured with information about:

### Clinic Information
- **Appointments**: Booking process, hours, contact
- **Services**: Orthopedic and ENT specialties
- **Doctors**: Dr. K. M. Thomas and Dr. Susan Thomas
- **Fees**: Consultation costs (₹325 new, ₹25 review)
- **Location**: Chengannur, Kerala, India
- **Contact**: Phone and WhatsApp details

### Common Queries Handled
- "How do I book an appointment?"
- "What are your clinic hours?"
- "How much does consultation cost?"
- "Where are you located?"
- "What services do you offer?"
- "How can I contact you?"

## 🔒 Privacy & Security

### Data Handling
- **Local AI**: No data sent to external servers
- **OpenAI**: Messages sent to OpenAI API (review their privacy policy)
- **Storage**: Chat history stored locally in browser

### Medical Disclaimer
The chatbot:
- ✅ Provides general clinic information
- ✅ Helps with appointments and scheduling
- ✅ Answers basic questions about services
- ❌ Does NOT provide medical advice
- ❌ Does NOT diagnose conditions
- ❌ Does NOT recommend treatments

**Always direct patients to call the clinic for medical concerns.**

## 🚀 Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Deploy
Upload the `dist/` folder to your web hosting service.

### 3. Environment Variables (if using OpenAI)
Make sure to set `REACT_APP_OPENAI_API_KEY` in your hosting environment.

## 📊 Analytics & Monitoring

### Built-in Features
- Message history tracking
- Response time monitoring
- Error logging
- Usage statistics

### Optional Integrations
Consider adding:
- Google Analytics
- Hotjar for user behavior
- Custom analytics dashboard

## 🛠️ Troubleshooting

### Common Issues

#### 1. Chatbot Not Appearing
- Check if `Chatbot` component is imported in `App.tsx`
- Verify CSS is loading correctly
- Check browser console for errors

#### 2. OpenAI Not Working
- Verify API key is correct
- Check environment variable is set
- Ensure `enabled: true` in config
- Check OpenAI account has credits

#### 3. Styling Issues
- Clear browser cache
- Check CSS file paths
- Verify responsive design breakpoints

#### 4. Performance Issues
- Reduce response delay in config
- Optimize images and assets
- Consider lazy loading

## 🔄 Updates & Maintenance

### Regular Tasks
1. **Update clinic information** in `aiService.ts`
2. **Review and improve responses** based on user feedback
3. **Monitor API usage** (if using OpenAI)
4. **Test on different devices** and browsers
5. **Update dependencies** regularly

### Adding New Features
1. **Quick replies**: Add common questions as buttons
2. **File uploads**: Allow patients to upload documents
3. **Voice input**: Enable speech-to-text
4. **Multi-language**: Add support for Malayalam
5. **Integration**: Connect with appointment booking system

## 📞 Support

For technical support or questions:
- Check the browser console for error messages
- Review the configuration files
- Test with different browsers
- Contact your web developer

## 🎯 Best Practices

### For Patients
- Use clear, simple language
- Provide specific information
- Always offer to connect with human staff
- Include contact information in responses

### For Developers
- Keep responses concise
- Test thoroughly before deployment
- Monitor performance and errors
- Update knowledge base regularly
- Maintain security best practices

---

**Note**: This chatbot is designed to enhance patient experience while maintaining medical ethics and privacy standards. Always prioritize patient safety and direct them to appropriate medical professionals when needed. 