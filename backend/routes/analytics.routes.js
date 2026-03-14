const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Dashboard statistics
router.get('/dashboard', auth, roleCheck('cessca_staff', 'admin', 'officer'), async (req, res) => {
    try {
        // Total users by role
        const [userStats] = await pool.query(
            `SELECT role, COUNT(*) as count, status
             FROM users
             GROUP BY role, status`
        );

        // Organization statistics
        const [orgStats] = await pool.query(
            'SELECT * FROM v_organization_stats WHERE status = "active"'
        );

        // Total organizations
        const [orgCount] = await pool.query(
            'SELECT COUNT(*) as total FROM organizations WHERE status = "active"'
        );

        // Recent activities
        const [recentActivities] = await pool.query(
            `SELECT oa.*, o.org_name, o.org_acronym
             FROM organization_activities oa
             JOIN organizations o ON oa.org_id = o.org_id
             WHERE oa.status = 'approved' AND oa.start_date >= CURDATE()
             ORDER BY oa.start_date ASC
             LIMIT 10`
        );

        // Discipline cases summary
        const [disciplineStats] = await pool.query(
            `SELECT status, COUNT(*) as count
             FROM discipline_cases
             GROUP BY status`
        );

        // Recent registrations
        const [recentUsers] = await pool.query(
            `SELECT u.user_id, u.email, u.role, u.status, u.created_at,
                    up.first_name, up.last_name
             FROM users u
             LEFT JOIN user_profiles up ON u.user_id = up.user_id
             WHERE u.status = 'pending'
             ORDER BY u.created_at DESC
             LIMIT 10`
        );

        // Upcoming events
        const [upcomingEvents] = await pool.query(
            `SELECT * FROM sports_events
             WHERE status = 'upcoming' AND event_date >= CURDATE()
             ORDER BY event_date ASC
             LIMIT 10`
        );

        // Alumni statistics
        const [alumniStats] = await pool.query(
            `SELECT current_employment_status, COUNT(*) as count
             FROM alumni_profiles
             GROUP BY current_employment_status`
        );

        res.json({
            success: true,
            dashboard: {
                userStats,
                organizations: {
                    total: orgCount[0].total,
                    details: orgStats
                },
                recentActivities,
                disciplineStats,
                pendingRegistrations: recentUsers,
                upcomingEvents,
                alumniStats
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard data',
            error: error.message 
        });
    }
});

// Student dashboard statistics
router.get('/student-dashboard', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Organizations joined
        const [myOrganizations] = await pool.query(
            `SELECT o.org_id, o.org_name, o.org_acronym, o.org_type, om.joined_date, om.membership_status
             FROM organization_members om
             JOIN organizations o ON om.org_id = o.org_id
             WHERE om.user_id = ? AND om.membership_status = 'active'
             ORDER BY om.joined_date DESC`,
            [userId]
        );

        // Discipline cases
        const [myCases] = await pool.query(
            `SELECT case_id, case_number, subject, status, created_at
             FROM discipline_cases
             WHERE complainant_id = ? OR respondent_id = ?
             ORDER BY created_at DESC
             LIMIT 5`,
            [userId, userId]
        );

        // Upcoming organization activities
        const [upcomingActivities] = await pool.query(
            `SELECT oa.activity_id, oa.activity_title, oa.activity_type, oa.start_date, oa.end_date,
                    o.org_name, o.org_acronym
             FROM organization_activities oa
             JOIN organizations o ON oa.org_id = o.org_id
             JOIN organization_members om ON o.org_id = om.org_id
             WHERE om.user_id = ? AND om.membership_status = 'active'
               AND oa.status = 'approved' AND oa.start_date >= CURDATE()
             ORDER BY oa.start_date ASC
             LIMIT 10`,
            [userId]
        );

        // Upcoming sports events
        const [upcomingSports] = await pool.query(
            `SELECT event_id, event_name, event_type, event_date, venue, status
             FROM sports_events
             WHERE status IN ('upcoming', 'registration_open') AND event_date >= CURDATE()
             ORDER BY event_date ASC
             LIMIT 5`
        );

        res.json({
            success: true,
            dashboard: {
                organizations: myOrganizations,
                disciplineCases: myCases,
                upcomingActivities,
                upcomingSports
            }
        });

    } catch (error) {
        console.error('Get student dashboard error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch student dashboard data',
            error: error.message 
        });
    }
});

// Organization participation statistics
router.get('/organizations/stats', auth, roleCheck('cessca_staff', 'admin', 'officer'), async (req, res) => {
    try {
        const { year, semester } = req.query;
        
        let query = `
            SELECT o.org_id, o.org_name, o.org_acronym, o.org_type,
                   COUNT(DISTINCT om.member_id) as total_members,
                   COUNT(DISTINCT oo.officer_id) as total_officers,
                   COUNT(DISTINCT oa.activity_id) as total_activities,
                   COUNT(DISTINCT CASE WHEN oa.status = 'completed' THEN oa.activity_id END) as completed_activities
            FROM organizations o
            LEFT JOIN organization_members om ON o.org_id = om.org_id AND om.membership_status = 'active'
            LEFT JOIN organization_officers oo ON o.org_id = oo.org_id AND oo.status = 'active'
            LEFT JOIN organization_activities oa ON o.org_id = oa.org_id
            WHERE o.status = 'active'
        `;
        const params = [];

        if (year) {
            query += ' AND YEAR(oa.start_date) = ?';
            params.push(year);
        }

        query += ' GROUP BY o.org_id ORDER BY total_members DESC';

        const [stats] = await pool.query(query, params);

        // Activity types breakdown
        const [activityTypes] = await pool.query(
            `SELECT activity_type, COUNT(*) as count
             FROM organization_activities
             WHERE status IN ('approved', 'completed')
             GROUP BY activity_type
             ORDER BY count DESC`
        );

        // Monthly activity trend
        const [monthlyTrend] = await pool.query(
            `SELECT 
                YEAR(start_date) as year,
                MONTH(start_date) as month,
                COUNT(*) as activity_count
             FROM organization_activities
             WHERE status IN ('approved', 'completed')
               AND start_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY YEAR(start_date), MONTH(start_date)
             ORDER BY year, month`
        );

        res.json({
            success: true,
            statistics: {
                organizationStats: stats,
                activityTypes,
                monthlyTrend
            }
        });

    } catch (error) {
        console.error('Get organization stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch organization statistics',
            error: error.message 
        });
    }
});

// Alumni employment reports
router.get('/alumni/reports', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        // Employment rate by year
        const [employmentByYear] = await pool.query(
            `SELECT 
                graduation_year,
                COUNT(*) as total_alumni,
                COUNT(CASE WHEN current_employment_status IN ('employed', 'self-employed') THEN 1 END) as employed,
                ROUND(COUNT(CASE WHEN current_employment_status IN ('employed', 'self-employed') THEN 1 END) * 100.0 / COUNT(*), 2) as employment_rate
             FROM alumni_profiles
             GROUP BY graduation_year
             ORDER BY graduation_year DESC`
        );

        // Employment by program
        const [employmentByProgram] = await pool.query(
            `SELECT 
                degree_program,
                COUNT(*) as total_alumni,
                COUNT(CASE WHEN current_employment_status IN ('employed', 'self-employed') THEN 1 END) as employed,
                ROUND(COUNT(CASE WHEN current_employment_status IN ('employed', 'self-employed') THEN 1 END) * 100.0 / COUNT(*), 2) as employment_rate
             FROM alumni_profiles
             GROUP BY degree_program
             ORDER BY total_alumni DESC`
        );

        // Top industries
        const [topIndustries] = await pool.query(
            `SELECT industry, COUNT(*) as count
             FROM alumni_profiles
             WHERE industry IS NOT NULL AND current_employment_status IN ('employed', 'self-employed')
             GROUP BY industry
             ORDER BY count DESC
             LIMIT 15`
        );

        // Top companies
        const [topCompanies] = await pool.query(
            `SELECT company_name, COUNT(*) as count
             FROM alumni_profiles
             WHERE company_name IS NOT NULL AND current_employment_status IN ('employed', 'self-employed')
             GROUP BY company_name
             ORDER BY count DESC
             LIMIT 15`
        );

        // Further education statistics
        const [furtherEducation] = await pool.query(
            `SELECT 
                degree_level,
                status,
                COUNT(*) as count
             FROM alumni_education
             GROUP BY degree_level, status
             ORDER BY degree_level, status`
        );

        // Achievement statistics
        const [achievements] = await pool.query(
            `SELECT 
                achievement_type,
                COUNT(*) as count
             FROM alumni_achievements
             GROUP BY achievement_type
             ORDER BY count DESC`
        );

        res.json({
            success: true,
            reports: {
                employmentByYear,
                employmentByProgram,
                topIndustries,
                topCompanies,
                furtherEducation,
                achievements
            }
        });

    } catch (error) {
        console.error('Get alumni reports error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch alumni reports',
            error: error.message 
        });
    }
});

// Discipline case summaries
router.get('/discipline/summary', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        // Overall statistics
        const [overallStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_cases,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_cases,
                COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing_cases,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_cases,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_cases,
                AVG(CASE WHEN resolved_at IS NOT NULL 
                    THEN DATEDIFF(resolved_at, created_at) END) as avg_resolution_days
             FROM discipline_cases`
        );

        // Cases by type and status
        const [casesByType] = await pool.query(
            `SELECT case_type, status, COUNT(*) as count
             FROM discipline_cases
             GROUP BY case_type, status
             ORDER BY case_type, status`
        );

        // Cases by severity
        const [casesBySeverity] = await pool.query(
            `SELECT severity, status, COUNT(*) as count
             FROM discipline_cases
             GROUP BY severity, status
             ORDER BY severity, status`
        );

        // Monthly case trend
        const [monthlyTrend] = await pool.query(
            `SELECT 
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                case_type,
                COUNT(*) as count
             FROM discipline_cases
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY YEAR(created_at), MONTH(created_at), case_type
             ORDER BY year, month, case_type`
        );

        // Consultation statistics
        const [consultationStats] = await pool.query(
            `SELECT 
                status,
                COUNT(*) as count
             FROM consultation_schedules
             GROUP BY status`
        );

        res.json({
            success: true,
            summary: {
                overall: overallStats[0],
                casesByType,
                casesBySeverity,
                monthlyTrend,
                consultationStats
            }
        });

    } catch (error) {
        console.error('Get discipline summary error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch discipline summary',
            error: error.message 
        });
    }
});

// Sports and events statistics
router.get('/sports/stats', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        // Event statistics
        const [eventStats] = await pool.query(
            `SELECT 
                event_type,
                status,
                COUNT(*) as count
             FROM sports_events
             GROUP BY event_type, status
             ORDER BY event_type, status`
        );

        // Participation statistics
        const [participationStats] = await pool.query(
            `SELECT 
                se.event_type,
                COUNT(DISTINCT ep.participant_id) as total_participants,
                COUNT(DISTINCT ep.user_id) as unique_participants
             FROM sports_events se
             LEFT JOIN event_participants ep ON se.event_id = ep.event_id
             GROUP BY se.event_type
             ORDER BY total_participants DESC`
        );

        // Award winners
        const [awardWinners] = await pool.query(
            `SELECT 
                u.user_id, up.first_name, up.last_name, up.student_id,
                COUNT(*) as award_count,
                GROUP_CONCAT(DISTINCT cr.award ORDER BY cr.rank_position) as awards
             FROM competition_results cr
             JOIN event_participants ep ON cr.participant_id = ep.participant_id
             JOIN users u ON ep.user_id = u.user_id
             JOIN user_profiles up ON u.user_id = up.user_id
             WHERE cr.award IS NOT NULL
             GROUP BY u.user_id
             ORDER BY award_count DESC
             LIMIT 20`
        );

        // Gallery statistics
        const [galleryStats] = await pool.query(
            `SELECT 
                category,
                year,
                COUNT(*) as photo_count,
                SUM(views) as total_views
             FROM sports_gallery
             GROUP BY category, year
             ORDER BY year DESC, category`
        );

        res.json({
            success: true,
            statistics: {
                eventStats,
                participationStats,
                awardWinners,
                galleryStats
            }
        });

    } catch (error) {
        console.error('Get sports stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch sports statistics',
            error: error.message 
        });
    }
});

// Export data endpoint (for PDF/Excel generation)
router.get('/export/:type', auth, roleCheck('cessca_staff', 'admin'), async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json', startDate, endDate } = req.query;
        
        let data;
        let filename;

        switch (type) {
            case 'organizations':
                [data] = await pool.query('SELECT * FROM v_organization_stats');
                filename = 'organizations_report';
                break;
                
            case 'alumni':
                [data] = await pool.query(
                    `SELECT ap.*, u.email, up.first_name, up.middle_name, up.last_name
                     FROM alumni_profiles ap
                     JOIN users u ON ap.user_id = u.user_id
                     JOIN user_profiles up ON u.user_id = up.user_id
                     ORDER BY ap.graduation_year DESC`
                );
                filename = 'alumni_report';
                break;
                
            case 'discipline':
                [data] = await pool.query(
                    `SELECT dc.*, 
                            c.email as complainant_email,
                            r.email as respondent_email
                     FROM discipline_cases dc
                     LEFT JOIN users c ON dc.complainant_id = c.user_id
                     LEFT JOIN users r ON dc.respondent_id = r.user_id
                     WHERE 1=1
                     ${startDate ? 'AND dc.created_at >= ?' : ''}
                     ${endDate ? 'AND dc.created_at <= ?' : ''}
                     ORDER BY dc.created_at DESC`,
                    [startDate, endDate].filter(Boolean)
                );
                filename = 'discipline_cases_report';
                break;
                
            case 'events':
                [data] = await pool.query(
                    `SELECT se.*, COUNT(DISTINCT ep.participant_id) as participant_count
                     FROM sports_events se
                     LEFT JOIN event_participants ep ON se.event_id = ep.event_id
                     GROUP BY se.event_id
                     ORDER BY se.event_date DESC`
                );
                filename = 'events_report';
                break;
                
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid export type' 
                });
        }

        // Return JSON format (frontend can convert to PDF/Excel)
        res.json({
            success: true,
            filename: `${filename}_${new Date().toISOString().split('T')[0]}`,
            data
        });

    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to export data',
            error: error.message 
        });
    }
});

module.exports = router;
