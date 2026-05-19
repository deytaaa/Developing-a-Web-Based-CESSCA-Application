const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./config/database');
require('dotenv').config();

const now = () => new Date().toISOString();

async function ensureUser(email, password, role, status) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO users (email, password, role, status)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (email)
     DO UPDATE SET password = EXCLUDED.password,
                   role = EXCLUDED.role,
                   status = EXCLUDED.status,
                   updated_at = NOW()
     RETURNING user_id`,
    [email, hashedPassword, role, status]
  );

  return result.insertId;
}

async function ensureProfile(userId, profile) {
  await pool.query(
    `INSERT INTO user_profiles (user_id, first_name, middle_name, last_name, student_id, course, year_level, contact_number, address, profile_picture)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id)
     DO UPDATE SET first_name = EXCLUDED.first_name,
                   middle_name = EXCLUDED.middle_name,
                   last_name = EXCLUDED.last_name,
                   student_id = EXCLUDED.student_id,
                   course = EXCLUDED.course,
                   year_level = EXCLUDED.year_level,
                   contact_number = EXCLUDED.contact_number,
                   address = EXCLUDED.address,
                   profile_picture = EXCLUDED.profile_picture`,
    [
      userId,
      profile.first_name,
      profile.middle_name || null,
      profile.last_name,
      profile.student_id || null,
      profile.course || null,
      profile.year_level || null,
      profile.contact_number || null,
      profile.address || null,
      profile.profile_picture || null,
    ]
  );
}

async function ensureOrganization(org) {
  const [existing] = await pool.query('SELECT org_id FROM organizations WHERE org_acronym = ? LIMIT 1', [org.org_acronym]);
  if (existing.length > 0) {
    return existing[0].org_id;
  }

  const [result] = await pool.query(
    `INSERT INTO organizations (org_name, org_acronym, org_type, description, mission, vision, status, founded_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING org_id`,
    [org.org_name, org.org_acronym, org.org_type, org.description, org.mission || null, org.vision || null, org.status || 'active', org.founded_date || null]
  );
  return result.insertId;
}

async function ensureAboutContent(content) {
  await pool.query(
    `INSERT INTO about_content (id, content)
     VALUES (1, ?)
     ON CONFLICT (id)
     DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
    [JSON.stringify(content)]
  );
}

async function ensureSystemSetting(key, value, description, updatedBy) {
  await pool.query(
    `INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (setting_key)
     DO UPDATE SET setting_value = EXCLUDED.setting_value,
                   description = EXCLUDED.description,
                   updated_by = EXCLUDED.updated_by,
                   updated_at = NOW()`,
    [key, value, description, updatedBy]
  );
}

async function seed() {
  const connected = await testConnection();
  if (!connected) {
    throw new Error('Database connection failed. Check DATABASE_URL and DB_SSL.');
  }

  const adminId = await ensureUser('admin@ptc.edu.ph', 'admin123', 'admin', 'active');
  const staffId = await ensureUser('cessca@ptc.edu.ph', 'cessca123', 'cessca_staff', 'active');
  const studentId = await ensureUser('student@ptc.edu.ph', 'student123', 'student', 'active');

  await ensureProfile(adminId, {
    first_name: 'System',
    last_name: 'Administrator',
    contact_number: '09123456789',
  });
  await ensureProfile(staffId, {
    first_name: 'CESSCA',
    last_name: 'Staff',
    contact_number: '09123456790',
  });
  await ensureProfile(studentId, {
    first_name: 'Juan',
    middle_name: 'Santos',
    last_name: 'Dela Cruz',
    student_id: '2024-001',
    course: 'BS Information Technology',
    year_level: '2nd Year',
    contact_number: '09123456791',
  });

  const organizations = [
    {
      org_name: 'Junior Philippine Computer Society',
      org_acronym: 'JPCS',
      org_type: 'academic',
      description: 'Organization for IT students.',
    },
    {
      org_name: 'Junior Philippine Association of Schools of Public Administration and Governance Students',
      org_acronym: 'JPASAPS',
      org_type: 'academic',
      description: 'Organization for Public Administration students.',
    },
    {
      org_name: 'Information Multimedia Art Gaming and Entertainment',
      org_acronym: 'IMAGE',
      org_type: 'social',
      description: 'Multimedia, arts, and creative activities organization.',
    },
    {
      org_name: 'The Plumage',
      org_acronym: 'PLUMAGE',
      org_type: 'cultural',
      description: 'Official publication and creative media organization.',
    },
  ];

  const orgIds = [];
  for (const org of organizations) {
    orgIds.push(await ensureOrganization(org));
  }

  for (const orgId of orgIds) {
    await pool.query(
      `INSERT INTO organization_members (org_id, user_id, membership_status, joined_date, approved_by, approved_at)
       VALUES (?, ?, 'active', CURRENT_DATE, ?, NOW())
       ON CONFLICT (org_id, user_id) DO NOTHING`,
      [orgId, studentId, adminId]
    );
  }

  await pool.query(
    `INSERT INTO organization_officers (org_id, user_id, position, term_start, term_end, status)
     VALUES (?, ?, 'President', CURRENT_DATE, ?, 'active')
     ON CONFLICT DO NOTHING`,
    [orgIds[0], studentId, '2026-05-31']
  );

  await pool.query(
    `INSERT INTO alumni_profiles (user_id, graduation_year, degree_program, current_employment_status, company_name, job_position, industry, employment_start_date, contact_email)
     VALUES (?, 2023, 'BS Information Technology', 'employed', 'Accenture', 'Software Engineer', 'Information Technology', '2024-07-01', 'john.alumni@gmail.com')
     ON CONFLICT (user_id)
     DO UPDATE SET graduation_year = EXCLUDED.graduation_year,
                   degree_program = EXCLUDED.degree_program,
                   current_employment_status = EXCLUDED.current_employment_status,
                   company_name = EXCLUDED.company_name,
                   job_position = EXCLUDED.job_position,
                   industry = EXCLUDED.industry,
                   employment_start_date = EXCLUDED.employment_start_date,
                   contact_email = EXCLUDED.contact_email`,
    // Alumni module removed - skipping alumni profile seeding
  );

  await pool.query(
    `INSERT INTO school_achievements (title, description, achievement_date, category, award_level, recipient, image_url, is_featured, created_by)
     VALUES
       ('Best LCU Corporate Video Award 2025 (3rd Place)', 'Pateros Technological College received the Human Resource Development Award for its corporate video.', '2025-12-08', 'academic', 'national', 'Pateros Technological College', '/uploads/sample-achievement-1.jpg', TRUE, ?),
       ('Participation in 14th IT Skills Olympics', 'PTC students participated in the annual IT Skills Olympics.', '2025-11-21', 'academic', 'national', 'Pateros Technological College', '/uploads/sample-achievement-2.jpg', FALSE, ?)
     ON CONFLICT DO NOTHING`,
    [adminId, adminId]
  );

  await pool.query(
    `INSERT INTO announcements (title, content, announcement_type, target_audience, priority, status, published_by, published_at)
     VALUES
       ('Welcome to Academic Year 2025-2026', 'We welcome all students to the new academic year.', 'general', 'all', 'high', 'published', ?, NOW()),
       ('Organization Fair', 'Join the organization fair and learn about student groups.', 'organization', 'students', 'high', 'published', ?, NOW())
     ON CONFLICT DO NOTHING`,
    [staffId, staffId]
  );

  await pool.query(
    `INSERT INTO sports_events (event_name, event_type, description, venue, event_date, start_time, end_time, organizer, target_participants, status, created_by)
     VALUES
       ('PTC Intramurals 2026', 'sports', 'Annual intramural sports competition.', 'PTC Gymnasium', '2026-10-15', '08:00:00', '17:00:00', 'CESSCA', 100, 'upcoming', ?),
       ('Cultural Night', 'cultural', 'Showcase of Filipino culture and arts.', 'PTC Auditorium', '2026-11-20', '18:00:00', '21:00:00', 'CESSCA', 200, 'upcoming', ?)
     ON CONFLICT DO NOTHING`,
    [adminId, adminId]
  );

  await ensureAboutContent({
    missionIntro: 'Pateros Technological College commits itself to quality education, service, and innovation.',
    vision: 'A premier technological college recognized for academic excellence and community engagement.',
    siteName: 'CESSCA - Pateros Technological College',
  });

  await ensureSystemSetting('site_name', 'CESSCA - Pateros Technological College', 'Website name', adminId);
  await ensureSystemSetting('site_email', 'cessca@ptc.edu.ph', 'Official email', adminId);
  await ensureSystemSetting('academic_year', '2025-2026', 'Current academic year', adminId);
  await ensureSystemSetting('semester', 'Second Semester', 'Current semester', adminId);

  console.log('✅ Supabase seed completed successfully');
  console.log('Login accounts:');
  console.log('  admin@ptc.edu.ph / admin123');
  console.log('  cessca@ptc.edu.ph / cessca123');
  console.log('  student@ptc.edu.ph / student123');

  await pool.end();
}

seed().catch(async (error) => {
  console.error('❌ Seed failed:', error.message);
  try {
    await pool.end();
  } catch {
    // ignore
  }
  process.exit(1);
});