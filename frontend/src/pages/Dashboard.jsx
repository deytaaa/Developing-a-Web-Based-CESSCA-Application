import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { analyticsService } from '../services/analyticsService';
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

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (['cessca_staff', 'admin', 'officer'].includes(user.role)) {
          const response = await analyticsService.getDashboard();
          setDashboard(response.dashboard);
        } else if (user.role === 'student') {
          const response = await analyticsService.getStudentDashboard();
          setDashboard(response.dashboard);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user.role]);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner centered size="lg" />
      </Layout>
    );
  }

  const upcomingTotal = (dashboard?.upcomingActivities?.length || 0) + (dashboard?.upcomingSports?.length || 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome back, {user?.profile?.first_name}!</p>
        </div>

        {dashboard && ['cessca_staff', 'admin'].includes(user.role) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                    <FiAlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Cases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.disciplineStats?.find((s) => s.status === 'pending')?.count || 0}
                    </p>
                    <Link to="/discipline" className="text-xs text-yellow-600 hover:underline">
                      View all →
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <FiUsers className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Orgs</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard.organizations?.total || 0}</p>
                    <Link to="/organizations" className="text-xs text-green-600 hover:underline">
                      View all →
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                    <FiCalendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard.upcomingEvents?.length || 0}</p>
                    <Link to="/sports" className="text-xs text-indigo-600 hover:underline">
                      View all →
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <FiAward className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Alumni Records</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.alumniStats?.reduce((acc, s) => acc + s.count, 0) || 0}
                    </p>
                    <Link to="/alumni" className="text-xs text-blue-600 hover:underline">
                      View all →
                    </Link>
                  </div>
                </div>
              </Card>
            </div>

            <Card title="Quick Access">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/analytics" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiBarChart2 className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Analytics</p>
                </Link>
                <Link to="/gallery" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiImage className="h-6 w-6 text-pink-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Gallery</p>
                </Link>
                <Link to="/sports" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiTrendingUp className="h-6 w-6 text-gold-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Sports & Arts</p>
                </Link>
                <Link to="/activities" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
                  <FiCalendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Activities</p>
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
                  <FiUsers className="h-6 w-6 text-blue-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/alumni" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <FiAward className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">Browse Alumni</h3>
                <p className="text-sm text-gray-600">Connect with fellow PTC graduates</p>
              </a>
              <a href="/profile" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <FiUsers className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">Update Profile</h3>
                <p className="text-sm text-gray-600">Keep your records up to date</p>
              </a>
              <a href="/sports" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <FiTrendingUp className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">Events</h3>
                <p className="text-sm text-gray-600">Participate in campus activities</p>
              </a>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
