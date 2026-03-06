# API Testing Guide - CESSCA Web Application

## Using Postman or Thunder Client

This guide helps you test the CESSCA API endpoints.

## Prerequisites

- Backend server running on `http://localhost:5000`
- API client (Postman, Thunder Client, or Insomnia)

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@ptc.edu.ph",
  "password": "password123",
  "role": "student",
  "firstName": "Juan",
  "middleName": "Santos",
  "lastName": "Dela Cruz",
  "studentId": "2024-001",
  "course": "BSIT"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ptc.edu.ph",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "admin@ptc.edu.ph",
    "role": "admin"
  }
}
```

Save the token for subsequent requests!

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

---

## 2. Organization Endpoints

### Get All Organizations
```http
GET /api/organizations
```

### Get Organization by ID
```http
GET /api/organizations/1
```

### Create Organization (Admin/CESSCA only)
```http
POST /api/organizations
Authorization: Bearer <token>
Content-Type: application/json

{
  "orgName": "Junior Philippine Computer Society - PTC Chapter",
  "orgAcronym": "JPCS",
  "orgType": "academic",
  "description": "Organization for IT students",
  "mission": "Promote excellence in IT education",
  "vision": "Leading IT organization in PTC",
  "foundedDate": "2020-01-15"
}
```

### Join Organization
```http
POST /api/organizations/1/join
Authorization: Bearer <token>
```

### Get Organization Members
```http
GET /api/organizations/1/members
Authorization: Bearer <token>
```

### Submit Activity Proposal
```http
POST /api/organizations/1/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "activityTitle": "Web Development Workshop",
  "description": "Learn modern web development",
  "activityType": "workshop",
  "venue": "PTC Computer Lab",
  "startDate": "2026-04-15T09:00:00",
  "endDate": "2026-04-15T17:00:00",
  "targetParticipants": 50,
  "budget": 5000
}
```

---

## 3. Alumni Endpoints

### Get All Alumni (CESSCA/Admin only)
```http
GET /api/alumni
Authorization: Bearer <token>
```

### Save Alumni Profile
```http
POST /api/alumni/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "graduationYear": 2024,
  "degreeProgram": "BS Information Technology",
  "currentEmploymentStatus": "employed",
  "companyName": "Tech Corp",
  "jobPosition": "Software Developer",
  "industry": "Information Technology",
  "employmentStartDate": "2024-06-01",
  "currentAddress": "Pateros, Metro Manila",
  "contactEmail": "alumni@email.com",
  "contactNumber": "09123456789"
}
```

### Add Achievement
```http
POST /api/alumni/1/achievements
Authorization: Bearer <token>
Content-Type: application/json

{
  "achievementType": "professional",
  "title": "AWS Certified Solutions Architect",
  "description": "Obtained AWS certification",
  "institution": "Amazon Web Services",
  "achievementDate": "2025-12-01"
}
```

---

## 4. Discipline & Consultation Endpoints

### Submit Case
```http
POST /api/discipline/cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "caseType": "consultation",
  "subject": "Academic Concerns",
  "description": "Need guidance on course selection",
  "isAnonymous": false,
  "severity": "minor"
}
```

### Get Cases
```http
GET /api/discipline/cases
Authorization: Bearer <token>
```

### Get Case by ID
```http
GET /api/discipline/cases/1
Authorization: Bearer <token>
```

### Update Case Status (CESSCA/Admin only)
```http
PUT /api/discipline/cases/1/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ongoing",
  "updateContent": "Assigned counselor and scheduled meeting"
}
```

---

## 5. Sports & Events Endpoints

### Get All Events
```http
GET /api/sports/events
```

### Create Event (CESSCA/Admin only)
```http
POST /api/sports/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventName": "PTC Intramurals 2026",
  "eventType": "sports",
  "description": "Annual intramural sports competition",
  "venue": "PTC Gymnasium",
  "eventDate": "2026-10-15",
  "startTime": "08:00:00",
  "endTime": "17:00:00",
  "organizer": "CESSCA",
  "targetParticipants": "All Students"
}
```

### Register for Event
```http
POST /api/sports/events/1/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "participationType": "individual"
}
```

### Get Gallery
```http
GET /api/sports/gallery?category=sports&year=2026
```

---

## 6. Analytics Endpoints

### Get Dashboard Data
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

### Get Organization Statistics
```http
GET /api/analytics/organizations/stats?year=2026
Authorization: Bearer <token>
```

### Get Alumni Reports
```http
GET /api/analytics/alumni/reports
Authorization: Bearer <token>
```

### Export Data
```http
GET /api/analytics/export/organizations
Authorization: Bearer <token>
```

---

## 7. Admin Endpoints

### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <token>
```

### Get Pending Users
```http
GET /api/admin/users/pending
Authorization: Bearer <token>
```

### Approve User
```http
PUT /api/admin/users/2/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active"
}
```

### Create Announcement
```http
POST /api/admin/announcements
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "System Maintenance Notice",
  "content": "The system will undergo maintenance on...",
  "announcementType": "general",
  "targetAudience": "all",
  "priority": "high"
}
```

---

## Quick Test Sequence

1. **Register** a new user
2. **Login** with credentials
3. **Get profile** using token
4. **Get organizations** list
5. **Join** an organization
6. **Submit** an activity proposal

## Common Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Testing Tips

1. Save the JWT token after login
2. Include token in Authorization header for protected routes
3. Check response messages for errors
4. Test with different user roles
5. Verify database changes after POST/PUT requests

## Postman Collection

You can import these endpoints into Postman by creating a new collection and adding each request manually, or use this structure:

```
CESSCA API
├── Auth
│   ├── Register
│   ├── Login
│   └── Get Profile
├── Organizations
│   ├── Get All
│   ├── Get by ID
│   ├── Create
│   └── Join
├── Alumni
├── Discipline
├── Sports
├── Analytics
└── Admin
```
