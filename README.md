# CESSCA Web Application - Pateros Technological College

## Overview
The Center for Student Service, Sports, Culture, and the Arts (CESSCA) Web Application is a comprehensive digital platform that integrates, automates, and manages all services under CESSCA at Pateros Technological College.

## Features

### 🔐 Authentication & Role-Based Access
- Secure JWT authentication
- Role-based dashboards for Students, Organization Officers, Alumni, CESSCA Personnel, and System Administrator

### 🎓 Student Organization Management
- View accredited organizations (JPCS, JPASAPS, IMAGE, etc.)
- Digital organization registration
- Membership and officer management
- Activity proposal submission and approval workflow
- Performance tracking

### 👥 Alumni Profile & Achievement Tracking
- Alumni registration portal
- Profile management
- Academic achievements tracking (Masteral, Doctoral)
- Career milestone recording
- Success monitoring dashboard

### 📋 Discipline & Consultation
- Secure complaint submission
- Consultation request system
- Case tracking dashboard
- Status monitoring (Pending, Ongoing, Resolved)
- Confidential data access control

### 🏆 Sports, Culture & Arts
- Event posting
- Competition results tracking
- Achievement documentation
- Photo gallery with year/category filtering

### 📊 Centralized Reporting & Analytics
- Real-time data dashboard
- Organization participation statistics
- Alumni employment reports
- Discipline case summaries
- Exportable reports (PDF/Excel)

### ⚙️ Administrative Portal
- User management
- Registration approval
- Announcement management
- System activity monitoring

## Tech Stack

### Frontend
- **Framework:** React.js (Vite)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS
- **State Management:** React Context API + Hooks

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **File Upload:** multer

## Project Structure

```
cessca-app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── organizations.routes.js
│   │   ├── alumni.routes.js
│   │   ├── discipline.routes.js
│   │   ├── sports.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   ├── models/
│   ├── uploads/
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Database Setup
1. Create a MySQL database:
```sql
CREATE DATABASE cessca_db;
```

2. Import the schema:
```bash
mysql -u root -p cessca_db < database/schema.sql
```

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cessca_db
JWT_SECRET=your_secret_key
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start development server:
```bash
npm run dev
```

## Default Users

After running the initial setup, you can login with these default credentials:

- **Admin:** admin@ptc.edu.ph / admin123
- **CESSCA Staff:** cessca@ptc.edu.ph / cessca123
- **Student:** student@ptc.edu.ph / student123

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get current user profile

### Organization Endpoints
- `GET /api/organizations` - Get all organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `POST /api/organizations/:id/members` - Add member
- `POST /api/organizations/:id/activities` - Submit activity proposal

### Alumni Endpoints
- `GET /api/alumni` - Get all alumni
- `POST /api/alumni/profile` - Create/update alumni profile
- `GET /api/alumni/:id` - Get alumni profile
- `POST /api/alumni/:id/achievements` - Add achievement

### Discipline Endpoints
- `POST /api/discipline/complaints` - Submit complaint
- `GET /api/discipline/cases` - Get cases
- `GET /api/discipline/cases/:id` - Get case details
- `PUT /api/discipline/cases/:id` - Update case status

### Sports & Arts Endpoints
- `GET /api/sports/events` - Get events
- `POST /api/sports/events` - Create event
- `POST /api/sports/events/:id/results` - Add results
- `POST /api/sports/gallery` - Upload photos

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/organizations` - Organization statistics
- `GET /api/analytics/alumni` - Alumni reports
- `GET /api/analytics/discipline` - Discipline summaries

## User Roles & Permissions

| Feature | Student | Officer | Alumni | CESSCA | Admin |
|---------|---------|---------|--------|--------|-------|
| View Organizations | ✓ | ✓ | ✓ | ✓ | ✓ |
| Join Organization | ✓ | ✓ | - | - | - |
| Manage Organization | - | ✓ | - | - | ✓ |
| Submit Activities | - | ✓ | - | - | - |
| Approve Activities | - | - | - | ✓ | ✓ |
| Alumni Profile | - | - | ✓ | ✓ | ✓ |
| Submit Complaint | ✓ | ✓ | - | - | - |
| Manage Cases | - | - | - | ✓ | ✓ |
| View Analytics | - | ✓ | - | ✓ | ✓ |
| User Management | - | - | - | - | ✓ |

## Security Features
- JWT token-based authentication
- Password hashing (bcrypt)
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

## Contributing
This project is developed for Pateros Technological College. For contributions or issues, please contact the development team.

## License
© 2026 Pateros Technological College. All rights reserved.

## Contact
- **Email:** ptc@paterostechnologicalcollege.edu.ph
- **Address:** 205 College Street, Sto. Rosario-Kanluran, Pateros, Metro Manila
- **Website:** https://paterostechnologicalcollege.edu.ph/
