# Netlify Functions Troubleshooting Guide

## 🚨 Problem: Functions Not Showing in Netlify Dashboard

### ✅ What We Just Fixed:

1. **Added `netlify.toml`** - Essential configuration file
2. **Moved `@netlify/functions` to dependencies** - Required for production
3. **Updated build scripts** - Proper TypeScript compilation
4. **Fixed TypeScript errors** - Clean compilation
5. **Pushed changes** - Triggered new deployment

### 🔍 Check These in Netlify Dashboard:

#### 1. Build Logs
- Go to your site's **Deploys** tab
- Click on the latest deployment
- Check **Build logs** for any errors
- Look for "Functions" section in logs

#### 2. Functions Tab
- After deployment, check **Functions** tab
- You should see:
  - `whatsapp-webhook`
  - `appointments`

#### 3. Environment Variables
- Go to **Site settings** → **Environment variables**
- Ensure these are set:
  ```bash
  WHATSAPP_TOKEN=your_token_here
  WHATSAPP_PHONE_NUMBER_ID=your_phone_id_here
  WHATSAPP_VERIFY_TOKEN=your_verify_token_here
  ```

### 🧪 Test Functions Locally:

```bash
# Test functions compilation
npm run build:functions

# Test locally (optional)
npm run netlify:dev
```

### 🚀 If Functions Still Don't Appear:

#### Option 1: Manual Trigger
1. Go to **Site settings** → **Build & deploy**
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete
4. Check Functions tab again

#### Option 2: Check Function Paths
Ensure your functions are in the correct location:
```
netlify/
  functions/
    whatsapp-webhook.ts
    appointments.ts
```

#### Option 3: Verify netlify.toml
Your `netlify.toml` should contain:
```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
```

### 📊 Expected Build Output:

When functions deploy successfully, you should see in build logs:
```
Functions
  whatsapp-webhook: netlify/functions/whatsapp-webhook.js
  appointments: netlify/functions/appointments.js
```

### 🔧 Common Issues & Solutions:

#### Issue: "Functions not found"
- **Solution**: Check `netlify.toml` functions path
- **Solution**: Ensure functions are in `netlify/functions/` directory

#### Issue: "TypeScript compilation failed"
- **Solution**: Run `npm run build:functions` locally first
- **Solution**: Fix any TypeScript errors before pushing

#### Issue: "Module not found"
- **Solution**: Check `@netlify/functions` is in dependencies (not devDependencies)
- **Solution**: Ensure all imports are correct

#### Issue: "Function timeout"
- **Solution**: Check function code for infinite loops
- **Solution**: Verify database connections

### 🎯 Next Steps After Functions Appear:

1. **Test webhook endpoint**: `https://your-site.netlify.app/.netlify/functions/whatsapp-webhook`
2. **Configure WhatsApp webhook** in Meta Developer Console
3. **Set environment variables** in Netlify
4. **Test with actual WhatsApp messages**

### 📞 Still Having Issues?

1. Check **Build logs** for specific error messages
2. Verify **Functions tab** after deployment
3. Ensure **Environment variables** are set
4. Check **GitHub repository** for latest changes
5. Try **Manual deploy** from Netlify dashboard

### 🔍 Debug Commands:

```bash
# Check if functions compile
npm run build:functions

# Check Netlify CLI version
netlify --version

# Check function files exist
ls -la netlify/functions/

# Check TypeScript config
npx tsc --showConfig
```

Remember: Functions only appear after a successful build and deployment! 