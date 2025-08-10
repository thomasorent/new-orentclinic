# Supabase Setup Guide

This guide will help you set up Supabase as your database for the Orent Clinic project.

## Prerequisites

- A Supabase account (free tier available)
- Your project deployed on Netlify

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `orent-clinic` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 3: Set Up Environment Variables

1. Create a `.env` file in your project root (copy from `env.example`)
2. Add your Supabase credentials:

```bash
# Supabase Database Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

3. In your Netlify dashboard, go to **Site settings** → **Environment variables**
4. Add the same environment variables there

## Step 4: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `scripts/supabase-setup.sql`
3. Paste and run the SQL script
4. This will create:
   - `appointments` table with proper structure
   - Indexes for performance
   - Trigger for automatic timestamp updates
   - Sample data (optional)

## Step 5: Test the Connection

1. Make sure your environment variables are set
2. Run the test script:

```bash
node scripts/test-db-connection.js
```

You should see:
```
🔍 Testing Supabase database connection...

✅ Database connection successful

🔧 Initializing database...
✅ Database initialized successfully

📊 Testing basic query...
✅ Query successful. Database is accessible

🎉 All database tests passed!

Your Supabase database is ready to use.
```

## Step 6: Deploy to Netlify

1. Push your changes to your Git repository
2. Netlify will automatically deploy the updated functions
3. Your Netlify functions will now use Supabase instead of PostgreSQL

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Public anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Private service role key | Yes |

## Security Notes

- **Never commit your `.env` file** to version control
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS)
- Use the `SUPABASE_ANON_KEY` for client-side operations
- Use the `SUPABASE_SERVICE_ROLE_KEY` only in server-side code (Netlify functions)

## Troubleshooting

### Connection Issues
- Verify your environment variables are correct
- Check if your Supabase project is active
- Ensure the `appointments` table exists

### Permission Issues
- Verify your service role key has the correct permissions
- Check if Row Level Security (RLS) policies are configured correctly

### Function Errors
- Check Netlify function logs in your dashboard
- Verify environment variables are set in Netlify

## Database Schema

The `appointments` table has the following structure:

```sql
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  department VARCHAR(50) NOT NULL CHECK (department IN ('Ortho', 'ENT')),
  patient_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Next Steps

After setting up Supabase:

1. Test your appointment booking system
2. Verify WhatsApp webhook functionality
3. Monitor your database usage in the Supabase dashboard
4. Set up additional security policies if needed

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/) 