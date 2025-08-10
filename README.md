# Orent Clinic - Appointment Management System

A modern web application for managing clinic appointments, built with React, TypeScript, and Vite.

## Features

- **Appointment Management**: Create, edit, and delete appointments
- **Department Support**: Ortho and ENT departments
- **Patient Information**: Store patient names and phone numbers
- **Date & Time Scheduling**: Separate date and time fields for precise scheduling
- **WhatsApp Integration**: Automated appointment booking via WhatsApp
- **Responsive Design**: Works on desktop and mobile devices

## Recent Changes (Latest Update)

**Removed Fields**: The `paid` and `confirmed` columns have been removed from the appointments system to simplify the appointment management process.

### What Changed:
- Removed `paid` (boolean) and `confirmed` (boolean) columns from the database
- Simplified appointment cards to focus on essential information
- Removed status update buttons (confirm/unconfirm, mark paid/unpaid)
- Streamlined filtering options
- Updated WhatsApp integration to remove status information

### Database Migration:
If you have an existing database with these columns, use the migration script:
```bash
# Run the migration script
psql -d your_database_name -f scripts/migrate-remove-paid-confirmed.sql
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Netlify Functions
- **Database**: PostgreSQL
- **Styling**: CSS3 with responsive design
- **Deployment**: Netlify

## Project Structure

```
src/
├── components/          # React components
│   ├── AppointmentManager.tsx    # Main appointment management
│   ├── Chatbot.tsx              # WhatsApp chatbot interface
│   └── ChatbotConfigPanel.tsx   # Chatbot configuration
├── services/           # API services
│   ├── appointmentService.ts     # Appointment CRUD operations
│   └── aiService.ts             # AI/chatbot services
├── types/              # TypeScript type definitions
│   └── appointment.ts           # Appointment interfaces
└── config/             # Configuration files
    └── database.ts             # Database connection

netlify/
└── functions/          # Serverless functions
    ├── appointments.ts          # Appointment API endpoints
    └── whatsapp-webhook.ts     # WhatsApp webhook handler

scripts/                # Database scripts
├── setup-database.sql           # Initial database setup
└── migrate-remove-paid-confirmed.sql  # Migration script
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Netlify account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd new-orentclinic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up the database**
   ```bash
   # Create database and run setup script
   psql -d postgres -c "CREATE DATABASE orent_clinic;"
   psql -d orent_clinic -f scripts/setup-database.sql
   ```

5. **Test database connection**
   ```bash
   node scripts/test-db-connection.js
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Database Schema

The appointments table structure:
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  department VARCHAR(50) NOT NULL CHECK (department IN ('Ortho', 'ENT')),
  patient_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

## Deployment

### Netlify Functions

The backend API is deployed as Netlify Functions. Make sure to:
1. Set environment variables in Netlify dashboard
2. Deploy the `netlify/functions/` directory
3. Configure function URLs in the frontend

### Environment Variables

Required environment variables:
- `DB_USER` - Database username
- `DB_HOST` - Database host
- `DB_NAME` - Database name
- `DB_PASSWORD` - Database password
- `DB_PORT` - Database port
- `WHATSAPP_TOKEN` - WhatsApp Business API token
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp phone number ID


## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
