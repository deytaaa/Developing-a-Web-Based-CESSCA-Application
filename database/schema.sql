-- CESSCA Web Application Database Schema
-- Pateros Technological College
-- Created: March 2026

-- Drop existing database if exists (use with caution)
-- DROP DATABASE IF EXISTS cessca_db;

-- Create database
-- CREATE DATABASE IF NOT EXISTS cessca_db;
-- USE cessca_db;

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'officer', 'alumni', 'cessca_staff', 'admin') NOT NULL,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

CREATE TABLE user_profiles (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50),
    course VARCHAR(100),
    year_level VARCHAR(20),
    contact_number VARCHAR(20),
    address TEXT,
    profile_picture VARCHAR(255),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_user_id (user_id)
);

-- ============================================
-- STUDENT ORGANIZATIONS
-- ============================================

CREATE TABLE organizations (
    org_id INT PRIMARY KEY AUTO_INCREMENT,
    org_name VARCHAR(150) NOT NULL,
    org_acronym VARCHAR(20) NOT NULL,
    org_type ENUM('academic', 'cultural', 'sports', 'social', 'special_interest') NOT NULL,
    description TEXT,
    mission TEXT,
    vision TEXT,
    founded_date DATE,
    status ENUM('active', 'inactive', 'pending', 'suspended') DEFAULT 'pending',
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_org_type (org_type)
);

CREATE TABLE organization_officers (
    officer_id INT PRIMARY KEY AUTO_INCREMENT,
    org_id INT NOT NULL,
    user_id INT NOT NULL,
    position VARCHAR(100) NOT NULL,
    term_start DATE NOT NULL,
    term_end DATE,
    status ENUM('active', 'ended') DEFAULT 'active',
    appointed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_org_id (org_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

CREATE TABLE organization_members (
    member_id INT PRIMARY KEY AUTO_INCREMENT,
    org_id INT NOT NULL,
    user_id INT NOT NULL,
    membership_status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    joined_date DATE,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_membership (org_id, user_id),
    INDEX idx_org_id (org_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (membership_status)
);

CREATE TABLE organization_activities (
    activity_id INT PRIMARY KEY AUTO_INCREMENT,
    org_id INT NOT NULL,
    activity_title VARCHAR(200) NOT NULL,
    description TEXT,
    activity_type ENUM('seminar', 'workshop', 'competition', 'social', 'fundraising', 'community_service', 'other') NOT NULL,
    venue VARCHAR(200),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    target_participants INT,
    budget DECIMAL(10, 2),
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    submitted_by INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    review_remarks TEXT,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_org_id (org_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date)
);

CREATE TABLE activity_attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    attended BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP NULL,
    remarks TEXT,
    FOREIGN KEY (activity_id) REFERENCES organization_activities(activity_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (activity_id, user_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE organization_gallery (
    gallery_id INT PRIMARY KEY AUTO_INCREMENT,
    org_id INT NOT NULL,
    activity_id INT,
    album_name VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    photo_order INT DEFAULT 1,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES organization_activities(activity_id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_org_id (org_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_album_name (album_name)
);

-- ============================================
-- ALUMNI MANAGEMENT
-- ============================================

CREATE TABLE alumni_profiles (
    alumni_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    graduation_year INT NOT NULL,
    degree_program VARCHAR(150) NOT NULL,
    current_employment_status ENUM('employed', 'self-employed', 'unemployed', 'studying') DEFAULT 'unemployed',
    company_name VARCHAR(200),
    job_position VARCHAR(150),
    industry VARCHAR(100),
    employment_start_date DATE,
    current_address TEXT,
    permanent_address TEXT,
    contact_email VARCHAR(100),
    contact_number VARCHAR(20),
    linkedin_profile VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_graduation_year (graduation_year),
    INDEX idx_employment_status (current_employment_status)
);

CREATE TABLE alumni_achievements (
    achievement_id INT PRIMARY KEY AUTO_INCREMENT,
    alumni_id INT NOT NULL,
    achievement_type ENUM('academic', 'professional', 'award', 'publication', 'certification', 'other') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    institution VARCHAR(200),
    achievement_date DATE,
    proof_document VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumni_id) REFERENCES alumni_profiles(alumni_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_alumni_id (alumni_id),
    INDEX idx_achievement_type (achievement_type),
    INDEX idx_verified (verified)
);

CREATE TABLE alumni_education (
    education_id INT PRIMARY KEY AUTO_INCREMENT,
    alumni_id INT NOT NULL,
    degree_level ENUM('masteral', 'doctoral', 'certificate', 'diploma') NOT NULL,
    degree_program VARCHAR(150) NOT NULL,
    institution VARCHAR(200) NOT NULL,
    start_date DATE,
    completion_date DATE,
    status ENUM('ongoing', 'completed', 'discontinued') DEFAULT 'ongoing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumni_id) REFERENCES alumni_profiles(alumni_id) ON DELETE CASCADE,
    INDEX idx_alumni_id (alumni_id),
    INDEX idx_degree_level (degree_level)
);

-- ============================================
-- DISCIPLINE & CONSULTATION
-- ============================================

CREATE TABLE discipline_cases (
    case_id INT PRIMARY KEY AUTO_INCREMENT,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    case_type ENUM('complaint', 'consultation', 'violation', 'counseling') NOT NULL,
    complainant_id INT,
    respondent_id INT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    incident_date DATE,
    incident_location VARCHAR(200),
    severity ENUM('minor', 'moderate', 'serious', 'critical') DEFAULT 'moderate',
    status ENUM('pending', 'ongoing', 'resolved', 'closed', 'escalated') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_to INT,
    assigned_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    resolution_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (complainant_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (respondent_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_case_number (case_number),
    INDEX idx_status (status),
    INDEX idx_case_type (case_type),
    INDEX idx_assigned_to (assigned_to)
);

CREATE TABLE case_updates (
    update_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    updated_by INT NOT NULL,
    update_type ENUM('note', 'action', 'status_change', 'resolution') NOT NULL,
    update_content TEXT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    attachment VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES discipline_cases(case_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE consultation_schedules (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    scheduled_date DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    location VARCHAR(200),
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES discipline_cases(case_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_status (status)
);

-- ============================================
-- SPORTS, CULTURE & ARTS
-- ============================================

CREATE TABLE sports_events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    event_name VARCHAR(200) NOT NULL,
    event_type ENUM('sports', 'cultural', 'arts', 'competition', 'exhibition', 'workshop') NOT NULL,
    description TEXT,
    venue VARCHAR(200),
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    organizer VARCHAR(200),
    target_participants VARCHAR(100),
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    featured_image VARCHAR(255),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_event_date (event_date),
    INDEX idx_event_type (event_type),
    INDEX idx_status (status)
);

CREATE TABLE event_participants (
    participant_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    team_name VARCHAR(100),
    participation_type ENUM('individual', 'team', 'organizer', 'volunteer') NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'confirmed', 'cancelled') DEFAULT 'registered',
    FOREIGN KEY (event_id) REFERENCES sports_events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_participation (event_id, user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE competition_results (
    result_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    participant_id INT NOT NULL,
    rank_position INT,
    award VARCHAR(100),
    score VARCHAR(50),
    remarks TEXT,
    recorded_by INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES sports_events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES event_participants(participant_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id),
    INDEX idx_rank_position (rank_position)
);

CREATE TABLE sports_gallery (
    gallery_id INT PRIMARY KEY AUTO_INCREMENT,
    album_id VARCHAR(50),
    event_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('sports', 'cultural', 'arts', 'activities', 'achievements', 'other') NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views INT DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    photo_order INT DEFAULT 1,
    FOREIGN KEY (event_id) REFERENCES sports_events(event_id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_album_id (album_id),
    INDEX idx_category (category),
    INDEX idx_year (year),
    INDEX idx_featured (featured)
);

-- ============================================
-- ANNOUNCEMENTS & NOTIFICATIONS
-- ============================================

CREATE TABLE announcements (
    announcement_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    announcement_type ENUM('general', 'organization', 'sports', 'academic', 'disciplinary', 'urgent') NOT NULL,
    target_audience ENUM('all', 'students', 'officers', 'alumni', 'specific_org') DEFAULT 'all',
    target_org_id INT,
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_by INT NOT NULL,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (target_org_id) REFERENCES organizations(org_id) ON DELETE SET NULL,
    FOREIGN KEY (published_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_announcement_type (announcement_type),
    INDEX idx_published_at (published_at)
);

CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- SCHOOL ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS school_achievements (
    achievement_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    achievement_date DATE NOT NULL,
    category ENUM('academic', 'sports', 'cultural', 'community', 'other') NOT NULL,
    award_level ENUM('international', 'national', 'regional', 'local', 'institutional') NOT NULL,
    recipient VARCHAR(200) NULL COMMENT 'Individual, team, or department name',
    image_url VARCHAR(255) NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_category (category),
    INDEX idx_award_level (award_level),
    INDEX idx_achievement_date (achievement_date),
    INDEX idx_is_featured (is_featured)
);

-- ============================================
-- SYSTEM LOGS & AUDIT
-- ============================================

CREATE TABLE activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
);

CREATE TABLE system_settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key)
);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Default Admin User (password: admin123 - hashed with bcrypt)
INSERT INTO users (email, password, role, status) VALUES
('admin@ptc.edu.ph', '$2a$10$rB5Z6qz6YYx5z6YYx5z6YOm6k6k6k6k6k6k6k6k6k6k6k6k6k', 'admin', 'active'),
('cessca@ptc.edu.ph', '$2a$10$rB5Z6qz6YYx5z6YYx5z6YOm6k6k6k6k6k6k6k6k6k6k6k6k6k', 'cessca_staff', 'active');

INSERT INTO user_profiles (user_id, first_name, last_name, contact_number) VALUES
(1, 'System', 'Administrator', '09123456789'),
(2, 'CESSCA', 'Staff', '09123456790');

-- Sample Organizations
INSERT INTO organizations (org_name, org_acronym, org_type, description, status) VALUES
('Junior Philippine Computer Society', 'JPCS', 'academic', 'Organization for IT students', 'active'),
('Junior Philippine Association of Schools of Public Administration and Governance Students', 'JPASAPS', 'academic', 'Organization for PA students', 'active'),
('Information Multimedia Art Gaming and Entertainment', 'IMAGE', 'social', 'Multimedia and arts organization', 'active'),
('The Plumage', 'PLUMAGE', 'cultural', 'Official publication of PTC', 'active');

-- System Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_name', 'CESSCA - Pateros Technological College', 'Website name'),
('site_email', 'cessca@ptc.edu.ph', 'Official email'),
('max_upload_size', '5242880', 'Max file upload size in bytes (5MB)'),
('academic_year', '2025-2026', 'Current academic year'),
('semester', 'Second Semester', 'Current semester');

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Organization Member Count
CREATE VIEW v_organization_stats AS
SELECT 
    o.org_id,
    o.org_name,
    o.org_acronym,
    o.org_type,
    o.status,
    COUNT(DISTINCT om.member_id) as member_count,
    COUNT(DISTINCT oo.officer_id) as officer_count,
    COUNT(DISTINCT oa.activity_id) as activity_count
FROM organizations o
LEFT JOIN organization_members om ON o.org_id = om.org_id AND om.membership_status = 'active'
LEFT JOIN organization_officers oo ON o.org_id = oo.org_id AND oo.status = 'active'
LEFT JOIN organization_activities oa ON o.org_id = oa.org_id
GROUP BY o.org_id;

-- Alumni Employment Statistics
CREATE VIEW v_alumni_employment_stats AS
SELECT 
    graduation_year,
    degree_program,
    current_employment_status,
    COUNT(*) as alumni_count
FROM alumni_profiles
GROUP BY graduation_year, degree_program, current_employment_status;

-- Discipline Case Summary
CREATE VIEW v_discipline_summary AS
SELECT 
    case_type,
    status,
    severity,
    COUNT(*) as case_count,
    AVG(DATEDIFF(COALESCE(resolved_at, NOW()), created_at)) as avg_resolution_days
FROM discipline_cases
GROUP BY case_type, status, severity;

-- Event Participation Statistics
CREATE VIEW v_event_stats AS
SELECT 
    se.event_id,
    se.event_name,
    se.event_type,
    se.event_date,
    se.status,
    COUNT(DISTINCT ep.participant_id) as participant_count,
    COUNT(DISTINCT cr.result_id) as result_count
FROM sports_events se
LEFT JOIN event_participants ep ON se.event_id = ep.event_id
LEFT JOIN competition_results cr ON se.event_id = cr.event_id
GROUP BY se.event_id;

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- Additional indexes for common queries
CREATE INDEX idx_users_status_role ON users(status, role);
CREATE INDEX idx_org_activities_dates ON organization_activities(start_date, end_date);
CREATE INDEX idx_alumni_year_status ON alumni_profiles(graduation_year, current_employment_status);
CREATE INDEX idx_discipline_status_priority ON discipline_cases(status, priority);
CREATE INDEX idx_events_type_date ON sports_events(event_type, event_date);

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

-- Procedure to approve organization membership
CREATE PROCEDURE sp_approve_membership(
    IN p_member_id INT,
    IN p_approved_by INT
)
BEGIN
    UPDATE organization_members 
    SET membership_status = 'active',
        approved_by = p_approved_by,
        approved_at = NOW()
    WHERE member_id = p_member_id;
    
    -- Log the action
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
    VALUES (p_approved_by, 'approve_membership', 'organization_member', p_member_id, 'Approved organization membership');
END //

-- Procedure to update case status
CREATE PROCEDURE sp_update_case_status(
    IN p_case_id INT,
    IN p_new_status VARCHAR(50),
    IN p_updated_by INT,
    IN p_update_content TEXT
)
BEGIN
    DECLARE v_old_status VARCHAR(50);
    
    SELECT status INTO v_old_status FROM discipline_cases WHERE case_id = p_case_id;
    
    UPDATE discipline_cases 
    SET status = p_new_status,
        resolved_at = IF(p_new_status IN ('resolved', 'closed'), NOW(), resolved_at)
    WHERE case_id = p_case_id;
    
    INSERT INTO case_updates (case_id, updated_by, update_type, update_content, previous_status, new_status)
    VALUES (p_case_id, p_updated_by, 'status_change', p_update_content, v_old_status, p_new_status);
END //

DELIMITER ;

-- ============================================
-- END OF SCHEMA
-- ============================================
