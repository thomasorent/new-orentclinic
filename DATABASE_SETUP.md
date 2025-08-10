# Database Setup Guide for Orent Clinic

This guide will help you set up PostgreSQL for the Orent Clinic appointment management system.

## Prerequisites

- PostgreSQL installed on your system
- Node.js and npm (for running the application)
- Access to create databases and tables

## Step 1: Install PostgreSQL

### On macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### On Windows:
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

## Step 2: Create Database and User

1. **Access PostgreSQL as superuser:**
   ```bash
   sudo -u postgres psql
   # or
   psql -U postgres
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE orent_clinic;
   ```

3. **Create a dedicated user (recommended):**
   ```sql
   CREATE USER orent_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE orent_clinic TO orent_user;
   ```

4. **Exit PostgreSQL:**
   ```sql
   \q
   ```

## Step 3: Run Database Setup Script

1. **Connect to the new database:**
   ```bash
   psql -U orent_user -d orent_clinic
   ```

2. **Run the setup script:**
   ```bash
   \i scripts/setup-database.sql
   ```

   Or copy and paste the contents of `scripts/setup-database.sql` directly into psql.

## Step 4: Configure Environment Variables

1. **Copy the environment template:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file with your database credentials:**
   ```bash
   # PostgreSQL Database Configuration
   DB_USER=orent_user
   DB_HOST=localhost
   DB_NAME=orent_clinic
   DB_PASSWORD=your_secure_password
   DB_PORT=5432
   ```

## Step 5: Install Dependencies

```bash
npm install
```

This will install the required PostgreSQL packages (`pg` and `@types/pg`).

## Step 6: Test Database Connection

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Check the console for database connection messages:**
   - "Database connection successful" - Connection working
   - "Database initialized successfully" - Tables created successfully

## Step 7: Verify Setup

1. **Check if tables were created:**
   ```bash
   psql -U orent_user -d orent_clinic
   ```
   ```sql
   \dt
   \d appointments
   ```

2. **Check sample data:**
   ```sql
   SELECT * FROM appointments;
   ```

## Troubleshooting

### Connection Issues
- **Error: "connection refused"** - PostgreSQL service not running
  ```bash
  # Start PostgreSQL service
  brew services start postgresql  # macOS
  sudo systemctl start postgresql  # Linux
  ```

- **Error: "authentication failed"** - Check username/password in `.env`
- **Error: "database does not exist"** - Run the CREATE DATABASE command

### Permission Issues
- **Error: "permission denied"** - Check user privileges
  ```sql
  GRANT ALL PRIVILEGES ON TABLE appointments TO orent_user;
  GRANT USAGE, SELECT ON SEQUENCE appointments_id_seq TO orent_user;
  ```

### Port Issues
- **Error: "port already in use"** - Check if PostgreSQL is running on a different port
  ```bash
  # Check PostgreSQL status
  ps aux | grep postgres
  ```

## Production Considerations

### Security
- Use strong passwords
- Limit database user permissions
- Enable SSL connections
- Use environment variables for sensitive data

### Performance
- The setup script includes indexes for common queries
- Monitor query performance with `EXPLAIN ANALYZE`
- Consider connection pooling for high traffic

### Backup
- Set up regular database backups
- Test restore procedures
- Store backups securely

## Database Schema

The `appointments` table includes:
- `id`: Auto-incrementing primary key
- `time_slot`: Appointment date and time
- `patient_name`: Patient's full name
- `department`: Either 'Ortho' or 'ENT'
- `patient_phone`: Patient's contact number
- `paid`: Payment status (boolean)
- `confirmed`: Confirmation status (boolean)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp (auto-updated)

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify database connection settings
3. Ensure PostgreSQL service is running
4. Check user permissions and database existence 