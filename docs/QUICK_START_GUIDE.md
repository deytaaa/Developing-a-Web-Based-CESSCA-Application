# 🚀 Quick Start Guide - Service Requests & Help Desk Modules

## ⚡ 5-Minute Setup

### Step 1: Run Database Migrations (2 minutes)

Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line):

```sql
-- Connect to your database
USE cessca_db;

-- Copy and paste the contents of these files:
-- 1. database/migrations/add_service_requests_module.sql
-- 2. database/migrations/add_help_desk_module.sql

-- Verify tables were created:
SHOW TABLES LIKE '%service_%';
SHOW TABLES LIKE '%help_desk%';
```

You should see **6 new tables**.

### Step 2: Create Upload Directories (1 minute)

In PowerShell:

```powershell
cd backend
New-Item -ItemType Directory -Path "uploads\service-requests" -Force
New-Item -ItemType Directory -Path "uploads\help-desk" -Force
```

### Step 3: Restart Servers (2 minutes)

**Backend:**
```powershell
cd backend
# Press Ctrl+C if server is running
npm start
```

**Frontend:**
```powershell
cd frontend
# Press Ctrl+C if server is running
npm run dev
```

### Step 4: Test! (As long as you want 😊)

1. Open http://localhost:5173
2. Login
3. See two new menu items:
   - 📄 **Service Requests**
   - ❓ **Help Desk**

---

## 📱 User Guide

### For Students

#### Submitting a Service Request
1. Click **Service Requests** → **New Request**
2. Select request type (e.g., "Certificate of Enrollment")
3. Enter purpose and details
4. Upload attachments if needed (optional)
5. Click **Submit Request**
6. Track progress in the dashboard

#### Submitting a Help Desk Ticket
1. Click **Help Desk** → **New Ticket**
2. Select category (e.g., "Technical Issue")
3. Write subject and description
4. Choose priority level
5. Upload screenshots (optional)
6. Click **Submit Ticket**
7. Check for responses in the ticket thread

### For Staff/Admin

#### Managing Service Requests
1. Navigate to `/admin/service-requests`
2. View all requests with statistics
3. Use filters to find specific requests
4. Click **Update** on any request
5. Change status and add remarks
6. Students get notified of changes

#### Managing Help Desk Tickets
1. Navigate to `/admin/help-desk`
2. View all tickets with statistics
3. Click **Assign** to assign tickets to staff
4. Click **Status** to update ticket status
5. View ticket thread to add responses
6. Use internal notes for staff communication

---

## 🎯 Common Use Cases

### Request a Certificate
1. Service Requests → New Request
2. Type: "Certificate of Enrollment"
3. Purpose: "For scholarship application"
4. Submit → Wait for approval

### Report a Technical Issue
1. Help Desk → New Ticket
2. Category: Technical
3. Priority: High (if urgent)
4. Describe the issue with details
5. Submit → Wait for staff response

### Track Request Status
1. Service Requests → Dashboard
2. See your request in the list
3. Click **View Details**
4. Check activity log for updates

### Add More Information
1. Open your request/ticket
2. Upload additional files (requests)
3. Add response message (tickets)
4. Staff will be notified

---

## 📊 Available Request Types

1. Certificate of Enrollment
2. Certificate of Good Moral Character
3. Certificate of Grades
4. Clearance
5. ID Replacement
6. Organization Membership Certificate
7. Event Participation Certificate
8. Other

---

## 🎫 Available Ticket Categories

1. **Technical** - System issues, bugs, errors
2. **Organization** - Questions about organizations
3. **Event** - Event-related inquiries
4. **Academic** - Academic concerns
5. **Facility** - Building/facility issues
6. **General** - General questions
7. **Feedback** - Suggestions and feedback

---

## 🔔 Notifications

You will be notified when:
- ✅ Your request status changes
- ✅ Staff responds to your ticket
- ✅ Your request is approved/rejected
- ✅ Your ticket is assigned to someone
- ✅ Your ticket is resolved

*(Note: Email notifications require SMTP configuration)*

---

## ❓ FAQ

**Q: How long does it take to process a request?**
A: Processing time varies by request type. Check the estimated completion date in your request details.

**Q: Can I cancel a request?**
A: Yes, you can cancel requests that are still "Pending". Once processing starts, cancellation is not allowed.

**Q: Can I edit a ticket after submitting?**
A: You can't edit the original ticket, but you can add responses with additional information.

**Q: Who can see my tickets?**
A: Only you and CESSCA staff can see your tickets. Other students cannot view them.

**Q: What if I forget my ticket number?**
A: Don't worry! You can see all your tickets in the Help Desk dashboard.

**Q: Can I attach multiple files?**
A: Yes, you can upload multiple files (up to 10MB each).

---

## 🔒 Privacy & Security

- ✅ Only you and staff can see your requests/tickets
- ✅ All data is encrypted in transit
- ✅ File uploads are validated and scanned
- ✅ Activity logs track all changes
- ✅ Role-based access control enforced

---

## 📞 Need Help?

If you encounter any issues:
1. Check the troubleshooting section in IMPLEMENTATION_STATUS.md
2. Submit a Help Desk ticket (Category: Technical)
3. Contact CESSCA staff directly

---

**Enjoy the new modules! 🎉**
