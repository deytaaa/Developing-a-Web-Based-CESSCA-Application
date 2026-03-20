# Setup Instructions - CESSCA Web Application

**Pateros Technological College - Center for Student Service, Sports, Culture, and the Arts**

*Featuring PTC's official Green & Gold color scheme*

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **npm** or **yarn** package manager
- A code editor (e.g., VS Code)

## Step-by-Step Installation

### 1. Database Setup

#### Create Database
Open MySQL command line or MySQL Workbench and run:

```sql
CREATE DATABASE cessca_db;
```

#### Import Schema
Navigate to the project directory and import the schema:

```bash
# Using MySQL command line
mysql -u root -p cessca_db < database/schema.sql

# Or using MySQL Workbench
# File > Run SQL Script > Select schema.sql
```

#### Verify Installation
```sql
USE cessca_db;
SHOW TABLES;
```

You should see all the tables created successfully.

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cessca_db
DB_PORT=3306

# JWT Secret (Change this!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Start Backend Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The backend server should now be running on `http://localhost:5000`

#### Verify Backend
Open browser and visit: `http://localhost:5000/health`

You should see:
```json
{
  "status": "OK",
  "message": "CESSCA API is running",
  "timestamp": "2026-03-05T..."
}
```

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables
The `.env` file is already created. Verify it contains:

```env
VITE_API_URL=http://localhost:5000/api
```

#### Start Frontend Development Server
```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

### 4. Access the Application

1. Open your browser
2. Navigate to `http://localhost:5173`
3. You should see the CESSCA login page

## Default Login Credentials

After setup, you can login with:

### Admin Account
- **Email:** admin@ptc.edu.ph
- **Password:** admin123
- **Note:** Password is hashed in database, you may need to update it

### CESSCA Staff Account
- **Email:** cessca@ptc.edu.ph
- **Password:** cessca123

### Test Student Account
You can register a new student account through the registration page.

## Troubleshooting

### Database Connection Failed
- Verify MySQL is running: `sudo systemctl status mysql` (Linux) or check Services (Windows)
- Check database credentials in `backend/.env`
- Ensure database `cessca_db` exists
- Check if port 3306 is available

### Backend Won't Start
- Check if port 5000 is already in use
- Verify all dependencies installed: `npm install`
- Check `.env` file configuration
- Look for error messages in terminal

### Frontend Won't Start
- Check if port 5173 is already in use
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear browser cache and reload

### CORS Errors
- Ensure backend `.env` has correct `CORS_ORIGIN`
- Restart both backend and frontend servers

### Cannot Login
- Check backend is running and accessible
- Verify database has users table with data
- Check browser console for errors
- Reset password hash in database

## Updating Password Hash

If you need to reset admin password, run this SQL:

```sql
-- Password: admin123
UPDATE users 
SET password = '$2a$10$YourBcryptHashHere' 
WHERE email = 'admin@ptc.edu.ph';
```

Generate hash using Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your_password', 10);
console.log(hash);
```

## Production Deployment

See `DEPLOYMENT.md` for production deployment instructions.

## Need Help?

- Check the main README.md for API documentation
- Review code comments in source files
- Contact: ptc@paterostechnologicalcollege.edu.ph
