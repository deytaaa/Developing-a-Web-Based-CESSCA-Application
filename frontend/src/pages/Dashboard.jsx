import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import artsBanner from '../assets/images/banner.jpg';
import { analyticsService } from '../services/analyticsService';
import { achievementService } from '../services/achievementService';
import { organizationService } from '../services/organizationService';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import {
  FiUsers,
  FiAward,
  FiAlertCircle,
  FiTrendingUp,
  FiBarChart2,
  FiImage,
  FiCalendar,
} from 'react-icons/fi';

const StatCard = ({ icon, iconBg, label, value, linkTo, linkLabel }) => (
  <Card className="!p-0 overflow-hidden border-0 shadow-[0_16px_40px_rgba(16,185,129,0.10)]">
    <div className="relative h-full bg-gradient-to-br from-white via-white to-emerald-50/70 p-6">
     
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg} ring-1 ring-black/5 shadow-sm`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {linkTo && (
            <Link to={linkTo} className="mt-2 inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              {linkLabel} →
            </Link>
          )}
        </div>
      </div>
    </div>
  </Card>
);

// Officer: Summary Cards
const OfficerSummaryCards = () => {
  const [orgs, setOrgs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const orgRes = await organizationService.getMyOfficerOrganizations();
        setOrgs(orgRes.organizations || []);
        let allActs = [];
        for (const org of orgRes.organizations || []) {
          const acts = await organizationService.getActivities(org.org_id, { upcoming: true });
          if (Array.isArray(acts.activities)) allActs = allActs.concat(acts.activities);
        }
        setActivities(allActs);
        const achRes = await achievementService.getAll({ recent: true, limit: 3 });
        setAchievements(achRes.achievements || []);
      } catch (e) {
        setOrgs([]); setActivities([]); setAchievements([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) return <LoadingSpinner size="sm" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="!p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-100 rounded-lg p-3"><FiUsers className="h-6 w-6 text-green-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Organizations</p>
            <p className="text-2xl font-bold text-gray-900">{orgs.length}</p>
          </div>
        </div>
      </Card>
      <Card className="!p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3"><FiCalendar className="h-6 w-6 text-green-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Upcoming Activities</p>
            <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
          </div>
        </div>
      </Card>
      <Card className="!p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3"><FiAward className="h-6 w-6 text-green-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Recent Achievements</p>
            <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};


const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (["cessca_staff", "admin", "officer"].includes(user.role)) {
          const response = await analyticsService.getDashboard();
          setDashboard(response.dashboard);
        } else if (user.role === "student") {
          const response = await analyticsService.getStudentDashboard();
          setDashboard(response.dashboard);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [user.role]);

  useEffect(() => {
    // Only fetch announcements for student/officer
    if (["student", "officer"].includes(user.role)) {
      setAnnLoading(true);
      adminService.getAnnouncements({ limit: 5, sort: "desc" })
        .then((res) => setAnnouncements(res.announcements || []))
        .catch(() => setAnnouncements([]))
        .finally(() => setAnnLoading(false));
    }
  }, [user.role]);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner centered size="lg" />
      </Layout>
    );
  }

  const upcomingTotal = (dashboard?.upcomingActivities?.length || 0) + (dashboard?.upcomingSports?.length || 0);

  // Announcement Section (for student/officer)
  const showAnnouncementSection = ["student", "officer"].includes(user.role);
  let urgentAnnouncement = null;
  let regularAnnouncements = [];
  if (showAnnouncementSection && announcements.length > 0) {
    urgentAnnouncement = announcements.find(a => a.announcement_type === "urgent" || a.announcementType === "urgent");
    regularAnnouncements = announcements
      .filter(a => (a.announcement_type || a.announcementType) !== "urgent")
      .slice(0, 3);
  }

  // Banner for student and officer
  const showBanner = ["student", "officer"].includes(user.role);
  const bannerTitle = user.role === "student"
    ? "Student Dashboard"
    : user.role === "officer"
    ? "Officer Dashboard"
    : "Dashboard";

  return (
    <Layout>
      <div className="space-y-6">
        {showBanner && (
          <div
            className="relative rounded-2xl overflow-hidden mb-2"
            style={{ minHeight: 140, background: `url(${artsBanner}) center/cover, #166534` }}
          >
       
            <div className="relative z-10 px-8 py-8 flex flex-col justify-center h-full">
              <div className="text-xs text-yellow-200 font-semibold mb-1">PTC CESSCA</div>
              <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 drop-shadow mb-1">
                Welcome back, <span className="text-white">{user?.profile?.first_name}!</span>
              </h1>
              <div className="text-lg md:text-2xl font-semibold text-white drop-shadow mb-1">{bannerTitle}</div>
            </div>
          </div>
        )}

        {dashboard && ['cessca_staff', 'admin'].includes(user.role) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                icon={<FiUsers className="h-6 w-6 text-emerald-600" />}
                iconBg="bg-emerald-100"
                label="Active Orgs"
                value={dashboard.organizations?.total || 0}
                linkTo="/organizations"
                linkLabel="View all"
              />
              <StatCard
                icon={<FiCalendar className="h-6 w-6 text-emerald-600" />}
                iconBg="bg-emerald-100"
                label="Upcoming Events"
                value={dashboard.upcomingEvents?.length || 0}
                linkTo="/sports"
                linkLabel="View all"
              />
            </div>
            <Card title="Quick Access">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { to: '/analytics', label: 'Analytics', icon: <FiBarChart2 className="h-6 w-6 text-emerald-600" />, tint: 'from-emerald-50 to-white' },
                  { to: '/gallery', label: 'Gallery', icon: <FiImage className="h-6 w-6 text-emerald-600" />, tint: 'from-sky-50 to-white' },
                  { to: '/sports', label: 'Sports & Arts', icon: <FiTrendingUp className="h-6 w-6 text-emerald-600" />, tint: 'from-lime-50 to-white' },
                  { to: '/activities', label: 'Activities', icon: <FiCalendar className="h-6 w-6 text-emerald-600" />, tint: 'from-amber-50 to-white' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`group rounded-2xl border border-gray-200 bg-gradient-to-br ${item.tint} p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100`}
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105">
                      {item.icon}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  </Link>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Officer dashboard summary cards */}
        {user.role === 'officer' && (
          <>
            <OfficerSummaryCards />
            {showAnnouncementSection && (
              <div className="space-y-4">
                {/* Urgent Banner */}
                {annLoading ? (
                  <LoadingSpinner size="sm" />
                ) : urgentAnnouncement ? (
                  <div className="w-full rounded-lg bg-red-50 border border-red-200 px-6 py-3 flex items-center mb-2">
                    <FiAlertCircle className="text-red-500 mr-3 text-xl" />
                    <span className="font-semibold text-red-700 text-sm">{urgentAnnouncement.title}</span>
                    <span className="ml-2 text-xs text-red-500">{urgentAnnouncement.content}</span>
                    {urgentAnnouncement.expires_at && (
                      <span className="ml-4 text-xs text-gray-500">Expires: {new Date(urgentAnnouncement.expires_at).toLocaleString()}</span>
                    )}
                  </div>
                ) : null}
                {/* Announcement Cards */}
                {regularAnnouncements.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {regularAnnouncements.map((a) => (
                      <Card key={a.announcement_id} className="!p-4">
                        <div className="flex items-center mb-2">
                          <FiAlertCircle className="text-primary-500 mr-2" />
                          <span className="font-semibold text-gray-900">{a.title}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-1">{a.content}</div>
                        <div className="flex items-center text-xs text-gray-500">
                          {a.created_at && (
                            <span>{new Date(a.created_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Card title="Quick Access">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link to="/organizations" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiUsers className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">My Organizations</p>
                </Link>
                <Link to="/activities" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiCalendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Manage Activities</p>
                </Link>
                <Link to="/achievements" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiAward className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Achievements</p>
                </Link>
              </div>
            </Card>
          </>
        )}

        {user.role === 'student' && dashboard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="!p-6">
                <div className="flex items-center">
                  <FiUsers className="h-6 w-6 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard.organizations?.length || 0}</p>
                  </div>
                </div>
              </Card>
              <Card className="!p-6">
                <div className="flex items-center">
                  <FiAlertCircle className="h-6 w-6 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">My Cases</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard.disciplineCases?.length || 0}</p>
                  </div>
                </div>
              </Card>
              <Card className="!p-6">
                <div className="flex items-center">
                  <FiCalendar className="h-6 w-6 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                    <p className="text-2xl font-bold text-gray-900">{upcomingTotal}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Announcements Section */}
            {showAnnouncementSection && (
              <div className="space-y-4">
                {/* Urgent Banner */}
                {annLoading ? (
                  <LoadingSpinner size="sm" />
                ) : urgentAnnouncement ? (
                  <div className="w-full rounded-lg bg-red-50 border border-red-200 px-6 py-3 flex items-center mb-2">
                    <FiAlertCircle className="text-red-500 mr-3 text-xl" />
                    <span className="font-semibold text-red-700 text-sm">{urgentAnnouncement.title}</span>
                    <span className="ml-2 text-xs text-red-500">{urgentAnnouncement.content}</span>
                    {urgentAnnouncement.expires_at && (
                      <span className="ml-4 text-xs text-gray-500">Expires: {new Date(urgentAnnouncement.expires_at).toLocaleString()}</span>
                    )}
                  </div>
                ) : null}
                {/* Announcement Cards */}
                {regularAnnouncements.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {regularAnnouncements.map((a) => (
                      <Card key={a.announcement_id} className="!p-4">
                        <div className="flex items-center mb-2">
                          <FiAlertCircle className="text-primary-500 mr-2" />
                          <span className="font-semibold text-gray-900">{a.title}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-1">{a.content}</div>
                        <div className="flex items-center text-xs text-gray-500">
                          {a.created_at && (
                            <span>{new Date(a.created_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {dashboard.disciplineCases?.length > 0 && (
              <Card title="Recent Discipline & Consultation Cases">
                <div className="space-y-3">
                  {dashboard.disciplineCases.slice(0, 5).map((caseItem) => (
                    <Link
                      key={caseItem.case_id}
                      to={`/discipline/cases/${caseItem.case_id}`}
                      className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 px-2 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{caseItem.subject}</p>
                        <p className="text-xs text-gray-600">Case #{caseItem.case_number}</p>
                      </div>
                      <Badge variant={caseItem.status === 'resolved' ? 'success' : 'warning'}>
                        {caseItem.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            <Card title="Quick Actions">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/organizations" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiUsers className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Organizations</p>
                </Link>
                <Link to="/discipline" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiAlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Submit Concern</p>
                </Link>
                <Link to="/sports" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiTrendingUp className="h-6 w-6 text-gold-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Sports & Arts</p>
                </Link>
              </div>
            </Card>
          </>
        )}

        {user.role === 'alumni' && (
            <Card title="Alumni Network">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <a href="/alumni" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <FiUsers className="h-8 w-8 text-primary-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Browse Alumni</h3>
                  <p className="text-sm text-gray-600">Connect with fellow PTC graduates</p>
                </a>
                <a href="/achievements" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <FiAward className="h-8 w-8 text-yellow-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Achievements</h3>
                  <p className="text-sm text-gray-600">See school and alumni achievements</p>
                </a>
                <a href="/about" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <FiUsers className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-medium text-gray-900">About PTC</h3>
                  <p className="text-sm text-gray-600">Learn more about PTC</p>
                </a>
                <a href="/profile" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <FiUsers className="h-8 w-8 text-primary-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Update Profile</h3>
                  <p className="text-sm text-gray-600">Keep your records up to date</p>
                </a>
              </div>
            </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
