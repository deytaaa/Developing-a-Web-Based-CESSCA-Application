const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cessca_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Get existing admin/cessca staff user
    const [existingUsers] = await connection.execute(
      'SELECT user_id, role FROM users WHERE role IN ("admin", "cessca_staff") LIMIT 1'
    );
    
    if (existingUsers.length === 0) {
      console.error('❌ No admin or CESSCA staff user found. Please run create-admin.js first.');
      process.exit(1);
    }
    
    const adminUserId = existingUsers[0].user_id;
    console.log(`✅ Using user ID ${adminUserId} for system operations`);

    // Hash password for all students
    const studentPassword = await bcrypt.hash('student123', 10);
    
    // ============================================
    // 1. CREATE STUDENTS
    // ============================================
    console.log('\n📝 Creating student accounts...');
    
    const students = [
      { email: 'maria.santos@ptc.edu.ph', firstName: 'Maria', middleName: 'Cruz', lastName: 'Santos', studentId: '2024-002', course: 'BS Information Technology', year: '2nd Year' },
      { email: 'jose.reyes@ptc.edu.ph', firstName: 'Jose', middleName: 'Garcia', lastName: 'Reyes', studentId: '2024-003', course: 'BS Information Technology', year: '3rd Year' },
      { email: 'ana.lopez@ptc.edu.ph', firstName: 'Ana', middleName: 'Martinez', lastName: 'Lopez', studentId: '2024-004', course: 'BS Public Administration', year: '2nd Year' },
      { email: 'carlos.cruz@ptc.edu.ph', firstName: 'Carlos', middleName: 'Rivera', lastName: 'Cruz', studentId: '2024-005', course: 'BS Information Technology', year: '4th Year' },
      { email: 'sofia.garcia@ptc.edu.ph', firstName: 'Sofia', middleName: 'Flores', lastName: 'Garcia', studentId: '2024-006', course: 'BS Public Administration', year: '3rd Year' },
      { email: 'miguel.torres@ptc.edu.ph', firstName: 'Miguel', middleName: 'Santos', lastName: 'Torres', studentId: '2024-007', course: 'BS Information Technology', year: '1st Year' },
      { email: 'isabella.ramos@ptc.edu.ph', firstName: 'Isabella', middleName: 'Cruz', lastName: 'Ramos', studentId: '2024-008', course: 'BS Public Administration', year: '2nd Year' },
      { email: 'diego.morales@ptc.edu.ph', firstName: 'Diego', middleName: 'Luna', lastName: 'Morales', studentId: '2024-009', course: 'BS Information Technology', year: '2nd Year' },
      { email: 'lucia.hernandez@ptc.edu.ph', firstName: 'Lucia', middleName: 'Reyes', lastName: 'Hernandez', studentId: '2024-010', course: 'BS Public Administration', year: '4th Year' },
      { email: 'gabriel.castro@ptc.edu.ph', firstName: 'Gabriel', middleName: 'Diaz', lastName: 'Castro', studentId: '2024-011', course: 'BS Information Technology', year: '3rd Year' },
      { email: 'valentina.ortiz@ptc.edu.ph', firstName: 'Valentina', middleName: 'Gomez', lastName: 'Ortiz', studentId: '2024-012', course: 'BS Information Technology', year: '1st Year' },
      { email: 'mateo.silva@ptc.edu.ph', firstName: 'Mateo', middleName: 'Perez', lastName: 'Silva', studentId: '2024-013', course: 'BS Public Administration', year: '3rd Year' },
    ];

    const studentIds = [];
    for (const student of students) {
      try {
        const [result] = await connection.execute(
          'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
          [student.email, studentPassword, 'student', 'active']
        );
        studentIds.push(result.insertId);
        
        await connection.execute(
          'INSERT INTO user_profiles (user_id, first_name, middle_name, last_name, student_id, course, year_level, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, student.firstName, student.middleName, student.lastName, student.studentId, student.course, student.year, `0912345${String(Math.floor(Math.random() * 9000) + 1000)}`]
        );
      } catch (error) {
        // If user exists, get their ID
        if (error.code === 'ER_DUP_ENTRY') {
          const [existing] = await connection.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [student.email]
          );
          if (existing.length > 0) {
            studentIds.push(existing[0].user_id);
          }
        }
      }
    }
    
    console.log(`✅ Created ${students.length} student accounts`);

    // ============================================
    // 2. ADD ORGANIZATION MEMBERS
    // ============================================
    console.log('\n📝 Adding organization members...');
    
    const existingStudent = 3; // student@ptc.edu.ph
    const allStudents = [existingStudent, ...studentIds];
    
    // Get organization IDs
    const [orgs] = await connection.execute('SELECT org_id FROM organizations ORDER BY org_id');
    
    let memberCount = 0;
    for (const studentId of allStudents.slice(0, 10)) {
      // Each student joins 1-2 random organizations
      const numOrgs = Math.floor(Math.random() * 2) + 1;
      const shuffled = [...orgs].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numOrgs; i++) {
        const orgId = shuffled[i].org_id;
        try {
          await connection.execute(
            'INSERT INTO organization_members (org_id, user_id, membership_status, joined_date, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?)',
            [orgId, studentId, 'active', '2025-09-01', adminUserId, new Date()]
          );
          memberCount++;
        } catch (error) {
          // Skip duplicates
        }
      }
    }
    
    console.log(`✅ Added ${memberCount} organization memberships`);

    // ============================================
    // 3. ADD ORGANIZATION OFFICERS
    // ============================================
    console.log('\n📝 Assigning organization officers...');
    
    const positions = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor'];
    let officerCount = 0;
    
    for (const org of orgs) {
      // Get members of this org
      const [members] = await connection.execute(
        'SELECT user_id FROM organization_members WHERE org_id = ? AND membership_status = "active" LIMIT 5',
        [org.org_id]
      );
      
      for (let i = 0; i < Math.min(positions.length, members.length); i++) {
        await connection.execute(
          'INSERT INTO organization_officers (org_id, user_id, position, term_start, term_end, status) VALUES (?, ?, ?, ?, ?, ?)',
          [org.org_id, members[i].user_id, positions[i], '2025-09-01', '2026-05-31', 'active']
        );
        officerCount++;
      }
    }
    
    console.log(`✅ Assigned ${officerCount} organization officers`);

    // ============================================
    // 4. ADD ALUMNI PROFILES
    // ============================================
    console.log('\n📝 Creating alumni profiles...');
    
    const alumniPassword = await bcrypt.hash('alumni123', 10);
    const alumniData = [
      { email: 'john.alumni@gmail.com', firstName: 'John', lastName: 'Dela Cruz', graduationYear: 2023, degree: 'BS Information Technology', company: 'Accenture', position: 'Software Engineer' },
      { email: 'jane.alumni@gmail.com', firstName: 'Jane', lastName: 'Santos', graduationYear: 2022, degree: 'BS Public Administration', company: 'Pateros Municipal Government', position: 'Administrative Officer' },
      { email: 'mark.alumni@gmail.com', firstName: 'Mark', lastName: 'Garcia', graduationYear: 2021, degree: 'BS Information Technology', company: 'IBM Philippines', position: 'Senior Developer' },
    ];
    
    for (const alumni of alumniData) {
      try {
        const [result] = await connection.execute(
          'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
          [alumni.email, alumniPassword, 'alumni', 'active']
        );
        
        await connection.execute(
          'INSERT INTO user_profiles (user_id, first_name, last_name, contact_number) VALUES (?, ?, ?, ?)',
          [result.insertId, alumni.firstName, alumni.lastName, `0917${Math.floor(Math.random() * 10000000)}`]
        );
        
        const [alumniProfileResult] = await connection.execute(
          'INSERT INTO alumni_profiles (user_id, graduation_year, degree_program, current_employment_status, company_name, job_position, industry, employment_start_date, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, alumni.graduationYear, alumni.degree, 'employed', alumni.company, alumni.position, 'Information Technology', `${alumni.graduationYear}-07-01`, alumni.email]
        );
        
        // Add some achievements
        await connection.execute(
          'INSERT INTO alumni_achievements (alumni_id, achievement_type, title, description, achievement_date) VALUES (?, ?, ?, ?, ?)',
          [alumniProfileResult.insertId, 'professional', 'Career Advancement', `Promoted to ${alumni.position}`, `${alumni.graduationYear + 1}-01-15`]
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error('Error creating alumni:', error.message);
        }
      }
    }
    
    console.log(`✅ Created ${alumniData.length} alumni profiles`);

    // ============================================
    // 5. ADD DISCIPLINE CASES
    // ============================================
    console.log('\n📝 Creating discipline cases...');
    
    const cases = [
      { studentId: allStudents[0], type: 'consultation', subject: 'Academic Guidance', description: 'Need help with course selection for next semester', severity: 'minor' },
      { studentId: allStudents[1], type: 'consultation', subject: 'Career Planning', description: 'Want to discuss career options after graduation', severity: 'minor' },
      { studentId: allStudents[2], type: 'complaint', subject: 'Noise Complaint', description: 'Disturbance in library during study hours', severity: 'moderate' },
    ];
    
    let caseCount = 0;
    for (const caseData of cases) {
      try {
        const caseNumber = `CASE-2026-${String(caseCount + 1).padStart(4, '0')}`;
        await connection.execute(
          'INSERT INTO discipline_cases (case_number, complainant_id, case_type, subject, description, status, severity, assigned_to, is_anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [caseNumber, caseData.studentId, caseData.type, caseData.subject, caseData.description, 'pending', caseData.severity, adminUserId, false]
        );
        caseCount++;
      } catch (error) {
        console.error('Error creating discipline case:', error.message);
      }
    }
    
    console.log(`✅ Created ${caseCount} discipline cases`);

    // ============================================
    // 6. ADD SPORTS EVENTS
    // ============================================
    console.log('\n📝 Creating sports events...');
    
    const events = [
      { name: 'PTC Intramurals 2026', type: 'sports', description: 'Annual intramural sports competition', venue: 'PTC Gymnasium', date: '2026-10-15', startTime: '08:00:00', endTime: '17:00:00' },
      { name: 'Cultural Night', type: 'cultural', description: 'Showcase of Filipino culture and arts', venue: 'PTC Auditorium', date: '2026-11-20', startTime: '18:00:00', endTime: '21:00:00' },
      { name: 'Basketball Tournament', type: 'sports', description: 'Inter-class basketball competition', venue: 'PTC Court', date: '2026-09-10', startTime: '09:00:00', endTime: '16:00:00' },
      { name: 'Arts Exhibition', type: 'cultural', description: 'Student artwork exhibition', venue: 'PTC Gallery', date: '2026-08-25', startTime: '10:00:00', endTime: '18:00:00' },
    ];
    
    const eventIds = [];
    for (const event of events) {
      try {
        const [result] = await connection.execute(
          'INSERT INTO sports_events (event_name, event_type, description, venue, event_date, start_time, end_time, status, organizer, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [event.name, event.type, event.description, event.venue, event.date, event.startTime, event.endTime, 'upcoming', 'CESSCA', adminUserId]
        );
        eventIds.push(result.insertId);
      } catch (error) {
        console.error('Error creating event:', error.message);
      }
    }
    
    // Register some students for events
    let registrationCount = 0;
    for (const eventId of eventIds) {
      const numParticipants = Math.floor(Math.random() * 8) + 3;
      for (let i = 0; i < numParticipants; i++) {
        try {
          await connection.execute(
            'INSERT INTO event_participants (event_id, user_id, participation_type, registration_date, status) VALUES (?, ?, ?, ?, ?)',
            [eventId, allStudents[i], 'individual', new Date(), 'registered']
          );
          registrationCount++;
        } catch (error) {
          // Skip duplicates
        }
      }
    }
    
    console.log(`✅ Created ${events.length} sports events with ${registrationCount} registrations`);

    // ============================================
    // 7. ADD ANNOUNCEMENTS
    // ============================================
    console.log('\n📝 Creating announcements...');
    
    const announcements = [
      { title: 'Welcome to Academic Year 2025-2026', content: 'We welcome all students to the new academic year. Classes will begin on August 15, 2025.', type: 'general', targetAudience: 'all', priority: 'high' },
      { title: 'Organization Fair - September 5', content: 'Join us for the Organization Fair where you can learn about different student organizations!', type: 'organization', targetAudience: 'students', priority: 'high' },
      { title: 'CESSCA Office Hours', content: 'CESSCA office is open Monday to Friday, 8AM-5PM. Feel free to drop by for consultations.', type: 'general', targetAudience: 'all', priority: 'normal' },
      { title: 'Scholarship Application Now Open', content: 'Scholarship applications for 2nd semester are now being accepted. Deadline: October 30, 2026.', type: 'academic', targetAudience: 'students', priority: 'high' },
      { title: 'System Maintenance Notice', content: 'The CESSCA web portal will undergo maintenance on March 10, 2026 from 12AM-4AM.', type: 'urgent', targetAudience: 'all', priority: 'normal' },
    ];
    
    for (const announcement of announcements) {
      try {
        await connection.execute(
          'INSERT INTO announcements (title, content, announcement_type, target_audience, priority, published_by, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [announcement.title, announcement.content, announcement.type, announcement.targetAudience, announcement.priority, adminUserId, 'published', new Date()]
        );
      } catch (error) {
        console.error('Error creating announcement:', error.message);
      }
    }
    
    console.log(`✅ Created ${announcements.length} announcements`);

    // ============================================
    // 8. ADD ORGANIZATION ACTIVITIES
    // ============================================
    console.log('\n📝 Creating organization activities...');
    
    const activities = [
      { orgId: 1, title: 'Web Development Workshop', description: 'Learn modern web development with React and Node.js', type: 'workshop', venue: 'Computer Lab 1', startDate: '2026-04-15 09:00:00', endDate: '2026-04-15 17:00:00', budget: 5000, status: 'approved' },
      { orgId: 1, title: 'Tech Talk: AI in Education', description: 'Guest speaker discussing artificial intelligence applications', type: 'seminar', venue: 'Auditorium', startDate: '2026-05-20 14:00:00', endDate: '2026-05-20 17:00:00', budget: 3000, status: 'approved' },
      { orgId: 2, title: 'Community Outreach Program', description: 'Barangay engagement and public service activity', type: 'community_service', venue: 'Barangay San Roque', startDate: '2026-06-10 08:00:00', endDate: '2026-06-10 15:00:00', budget: 8000, status: 'pending' },
      { orgId: 3, title: 'Photography Competition', description: 'Capture the essence of PTC campus life', type: 'competition', venue: 'PTC Campus', startDate: '2026-07-01 00:00:00', endDate: '2026-07-15 23:59:00', budget: 4000, status: 'approved' },
    ];
    
    for (const activity of activities) {
      try {
        await connection.execute(
          'INSERT INTO organization_activities (org_id, activity_title, description, activity_type, venue, start_date, end_date, target_participants, budget, status, submitted_by, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [activity.orgId, activity.title, activity.description, activity.type, activity.venue, activity.startDate, activity.endDate, 50, activity.budget, activity.status, studentIds.length > 0 ? studentIds[0] : 3, activity.status === 'approved' ? adminUserId : null, activity.status === 'approved' ? new Date() : null]
        );
      } catch (error) {
        console.error('Error creating activity:', error.message);
      }
    }
    
    console.log(`✅ Created ${activities.length} organization activities`);

    console.log('\n🎉 Sample data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${students.length + 3} total students (including existing)`);
    console.log(`   - ${memberCount} organization memberships`);
    console.log(`   - ${officerCount} organization officers`);
    console.log(`   - ${alumniData.length} alumni profiles`);
    console.log(`   - ${cases.length} discipline cases`);
    console.log(`   - ${events.length} sports/cultural events`);
    console.log(`   - ${registrationCount} event registrations`);
    console.log(`   - ${announcements.length} announcements`);
    console.log(`   - ${activities.length} organization activities`);
    console.log('\n✅ Your application now has realistic sample data for testing!\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedData();
