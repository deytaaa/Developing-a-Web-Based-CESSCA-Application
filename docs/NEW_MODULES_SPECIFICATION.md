# CESSCA System - New Modules Specification

## Overview
This document outlines the specifications for two new modules to enhance the CESSCA system:
1. **General Service Requests Module** - Online service request submission and tracking
2. **Student Inquiries / Help Desk Module** - Student support ticket system

---

## 1. GENERAL SERVICE REQUESTS MODULE

### Features
- **Request Types**
  - Certificate of Enrollment
  - Good Moral Certificate
  - Certificate of Grades (COG)
  - Clearance Certificate
  - ID Replacement
  - Organization Membership Certificate
  - Event Participation Certificate
  - Other Documents

- **Core Functionality**
  - Online request submission with file attachments
  - Real-time status tracking
  - Staff approval workflow
  - Email notifications for status updates
  - Request history and archive
  - Priority levels (Normal, Urgent)
  - Estimated completion dates
  - Payment tracking (if applicable)
  - Request cancellation
  - Bulk approval for staff

- **Dashboard Statistics**
  - Total requests (by student)
  - Pending requests count
  - Approved/Rejected/Completed counts
  - Average processing time
  - Request type distribution

### Database Schema

#### Table: `service_requests`
```sql
CREATE TABLE service_requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    request_type ENUM('certificate_enrollment', 'good_moral', 'certificate_grades', 
                      'clearance', 'id_replacement', 'org_membership_cert', 
                      'event_participation_cert', 'other') NOT NULL,
    request_description TEXT,
    purpose TEXT NOT NULL,
    priority ENUM('normal', 'urgent') DEFAULT 'normal',
    status ENUM('pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_by INT,
    processed_date DATETIME,
    completion_date DATETIME,
    estimated_completion DATETIME,
    rejection_reason TEXT,
    payment_required BOOLEAN DEFAULT FALSE,
    payment_amount DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'waived') DEFAULT 'pending',
    pickup_location VARCHAR(255),
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_request_type (request_type),
    INDEX idx_requested_date (requested_date)
);
```

#### Table: `service_request_attachments`
```sql
CREATE TABLE service_request_attachments (
    attachment_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(request_id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id)
);
```

#### Table: `service_request_logs`
```sql
CREATE TABLE service_request_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    performed_by INT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id)
);
```

### Workflow

#### Student Workflow
1. **Submit Request**
   - Select request type
   - Fill in purpose and details
   - Attach supporting documents (optional)
   - Set priority level
   - Submit request

2. **Track Status**
   - View request in dashboard
   - Receive email notifications on status changes
   - Check estimated completion date
   - View processing notes

3. **Complete Request**
   - Receive notification when ready
   - Pick up document at specified location
   - Mark as received (optional)

#### Staff Workflow
1. **Review Queue**
   - View all pending requests
   - Filter by type, priority, date
   - Sort by urgency

2. **Process Request**
   - Review request details and attachments
   - Change status to "Processing"
   - Set estimated completion date
   - Add processing notes

3. **Approve/Reject**
   - Approve request
   - Or reject with reason
   - Notify student automatically

4. **Mark Complete**
   - Update status to "Completed"
   - Set pickup location
   - Notify student for pickup

### API Endpoints

#### Student Endpoints
- `POST /api/service-requests` - Submit new request
- `GET /api/service-requests/my-requests` - Get user's requests
- `GET /api/service-requests/:id` - Get request details
- `PUT /api/service-requests/:id/cancel` - Cancel request
- `POST /api/service-requests/:id/attachments` - Upload attachment

#### Staff Endpoints
- `GET /api/service-requests` - Get all requests (with filters)
- `GET /api/service-requests/statistics` - Get dashboard stats
- `PUT /api/service-requests/:id/status` - Update request status
- `PUT /api/service-requests/:id/process` - Process request
- `PUT /api/service-requests/:id/approve` - Approve request
- `PUT /api/service-requests/:id/reject` - Reject request
- `PUT /api/service-requests/:id/complete` - Mark as complete
- `DELETE /api/service-requests/:id/attachments/:attachmentId` - Delete attachment
- `GET /api/service-requests/:id/logs` - Get request activity logs

### UI Components

#### Student Views
1. **Service Requests Dashboard** (`/service-requests`)
   - Summary cards (Pending, Approved, Completed)
   - Request submission button
   - Recent requests table
   - Quick filters

2. **New Request Form** (`/service-requests/new`)
   - Request type selector
   - Purpose textarea
   - File upload area
   - Priority selector
   - Submit button

3. **Request Details** (`/service-requests/:id`)
   - Request information card
   - Status timeline
   - Attachments list
   - Activity log
   - Cancel button (if applicable)

#### Staff Views
1. **Service Requests Management** (`/admin/service-requests`)
   - Statistics overview
   - Filters (Type, Status, Priority, Date Range)
   - Requests table with actions
   - Bulk actions

2. **Request Processing Modal**
   - Request details
   - Status updater
   - Notes editor
   - Estimated completion date picker
   - Approve/Reject buttons

---

## 2. STUDENT INQUIRIES / HELP DESK MODULE

### Features
- **Inquiry Categories**
  - Technical Issue
  - Organization Concern
  - Event Question
  - Academic Concern
  - Facility Issue
  - General Inquiry
  - Feedback/Suggestion

- **Core Functionality**
  - Ticket submission with priority
  - Unique ticket ID generation
  - Real-time status tracking
  - Staff assignment system
  - Response thread (conversation)
  - File attachments
  - Ticket rating/feedback
  - Search and filter tickets
  - Canned responses for staff
  - Escalation system
  - Auto-close after resolution

- **Dashboard Statistics**
  - Open tickets count
  - Resolved tickets count
  - Average response time
  - Average resolution time
  - Tickets by category
  - Staff performance metrics

### Database Schema

#### Table: `help_desk_tickets`
```sql
CREATE TABLE help_desk_tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category ENUM('technical', 'organization', 'event', 'academic', 
                  'facility', 'general', 'feedback') NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    status ENUM('open', 'in_progress', 'waiting_response', 'resolved', 'closed') DEFAULT 'open',
    description TEXT NOT NULL,
    assigned_to INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    first_response_at DATETIME,
    resolved_at DATETIME,
    closed_at DATETIME,
    satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
    satisfaction_feedback TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);
```

#### Table: `help_desk_responses`
```sql
CREATE TABLE help_desk_responses (
    response_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_staff_response BOOLEAN DEFAULT FALSE,
    is_internal_note BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES help_desk_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_created_at (created_at)
);
```

#### Table: `help_desk_attachments`
```sql
CREATE TABLE help_desk_attachments (
    attachment_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT,
    response_id INT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    uploaded_by INT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES help_desk_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (response_id) REFERENCES help_desk_responses(response_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id)
);
```

### Workflow

#### Student Workflow
1. **Submit Inquiry**
   - Select category
   - Enter subject and description
   - Set priority (optional)
   - Attach files (optional)
   - Receive ticket number

2. **Track Ticket**
   - View ticket status
   - Receive email notifications
   - Add follow-up responses
   - View staff responses

3. **Close Ticket**
   - Confirm resolution
   - Rate satisfaction
   - Provide feedback

#### Staff Workflow
1. **View Tickets**
   - Dashboard with ticket queue
   - Filter by status, category, priority
   - Assign tickets to self or others

2. **Respond to Ticket**
   - Read ticket and history
   - Add response (public or internal note)
   - Attach files if needed
   - Update status

3. **Resolve Ticket**
   - Mark as resolved
   - Wait for student confirmation
   - Auto-close after 7 days

### API Endpoints

#### Student Endpoints
- `POST /api/help-desk` - Submit new ticket
- `GET /api/help-desk/my-tickets` - Get user's tickets
- `GET /api/help-desk/:ticketId` - Get ticket details
- `POST /api/help-desk/:ticketId/responses` - Add response
- `PUT /api/help-desk/:ticketId/close` - Close ticket
- `POST /api/help-desk/:ticketId/rate` - Rate ticket
- `POST /api/help-desk/:ticketId/attachments` - Upload attachment

#### Staff Endpoints
- `GET /api/help-desk` - Get all tickets (with filters)
- `GET /api/help-desk/statistics` - Get dashboard stats
- `PUT /api/help-desk/:ticketId/assign` - Assign ticket
- `PUT /api/help-desk/:ticketId/status` - Update status
- `POST /api/help-desk/:ticketId/internal-note` - Add internal note
- `PUT /api/help-desk/:ticketId/resolve` - Resolve ticket
- `GET /api/help-desk/:ticketId/history` - Get ticket history

### UI Components

#### Student Views
1. **Help Desk Dashboard** (`/help-desk`)
   - Summary cards (Open, In Progress, Resolved)
   - New ticket button
   - Tickets list with status
   - Quick search

2. **New Ticket Form** (`/help-desk/new`)
   - Category dropdown
   - Subject input
   - Description textarea
   - Priority selector
   - File upload
   - Submit button

3. **Ticket Details** (`/help-desk/ticket/:id`)
   - Ticket information
   - Response thread
   - Status timeline
   - Add response form
   - Rate ticket (when resolved)

#### Staff Views
1. **Help Desk Management** (`/admin/help-desk`)
   - Statistics dashboard
   - Ticket queue table
   - Filters and search
   - Assignment controls
   - Quick actions

2. **Ticket Processing Interface**
   - Full ticket details
   - Response history
   - Internal notes section
   - Response form
   - Status controls
   - Assignment dropdown

---

## Implementation Priority

### Phase 1 - Database & Backend (Week 1)
1. Create database migrations
2. Implement Service Requests API
3. Implement Help Desk API
4. Test endpoints

### Phase 2 - Frontend Services (Week 2)
1. Create service request service
2. Create help desk service
3. Implement API integration

### Phase 3 - UI Components (Week 3-4)
1. Build Service Requests pages
2. Build Help Desk pages
3. Integration testing
4. UI/UX refinement

### Phase 4 - Notifications & Polish (Week 5)
1. Email notification system
2. Dashboard integration
3. Activity logs
4. Final testing

---

## Security Considerations

- Role-based access control enforced at API level
- File upload validation and sanitization
- SQL injection prevention using parameterized queries
- XSS protection in all text fields
- CSRF protection on forms
- Rate limiting on ticket/request submission
- Secure file storage with access control
- Activity logging for audit trail

---

## Integration Points

### Existing Systems
- User authentication (using existing auth system)
- User profiles (linking to user_profiles table)
- Email notifications (existing email service)
- Dashboard statistics (adding new widgets)
- Admin navigation (adding new menu items)

### New Dependencies
- File upload handling (multer already in use)
- Notification queue system (optional for scale)
- PDF generation for certificates (optional future enhancement)

---

## Testing Requirements

### Unit Tests
- API endpoint validation
- Database operations
- File upload handling
- Status transition logic

### Integration Tests
- End-to-end workflows
- Role-based access control
- Notification triggers
- File attachment handling

### User Acceptance Testing
- Student request submission
- Staff processing workflow
- Ticket response system
- Email notifications
- Dashboard accuracy

---

## Future Enhancements

### Service Requests
- SMS notifications
- Payment gateway integration
- Digital signature for certificates
- QR code verification
- Automated document generation
- Appointment scheduling

### Help Desk
- Live chat integration
- Chatbot for common questions
- Knowledge base integration
- Ticket escalation rules
- SLA tracking
- Multi-language support
- Video/screen recording attachments

---

## Success Metrics

### Service Requests
- Reduction in physical queue time
- Average processing time
- User satisfaction rating
- Request completion rate
- Staff efficiency metrics

### Help Desk
- First response time
- Resolution time
- Customer satisfaction score (CSAT)
- Ticket resolution rate
- Staff workload distribution

