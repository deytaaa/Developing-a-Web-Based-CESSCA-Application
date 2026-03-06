import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';
import { FiUsers, FiAward, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      if (['cessca_staff', 'admin', 'officer'].includes(user.role)) {
        const response = await analyticsService.getDashboard();
        setDashboard(response.dashboard);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner centered size="lg" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome back, {user?.profile?.first_name}!</p>
        </div>

        {/* Stats Grid */}
        {dashboard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                    <FiUsers className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.userStats?.reduce((acc, stat) => acc + stat.count, 0) || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <FiAward className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.organizations?.total || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                    <FiAlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Cases</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.disciplineStats?.find(s => s.status === 'pending')?.count || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gold-100 rounded-lg p-3">
                    <FiTrendingUp className="h-6 w-6 text-gold-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.upcomingEvents?.length || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Recent Activities">
                <div className="space-y-4">
                  {dashboard.recentActivities?.length > 0 ? (
                    dashboard.recentActivities.map((activity) => (
                      <div key={activity.activity_id} className="border-l-4 border-primary-500 pl-4">
                        <h4 className="font-medium text-gray-900">{activity.activity_title}</h4>
                        <p className="text-sm text-gray-600">{activity.org_acronym}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent activities</p>
                  )}
                </div>
              </Card>

              {/* Pending Registrations - Admin Only */}
              {user.role === 'admin' && (
                <Card title="Pending Registrations">
                  <div className="space-y-4">
                    {dashboard.pendingRegistrations?.length > 0 ? (
                      dashboard.pendingRegistrations.map((user) => (
                        <div key={user.user_id} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <Badge variant="warning">{user.role}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No pending registrations</p>
                    )}
                  </div>
                </Card>
              )}

              {/* Organizations Summary - CESSCA Staff */}
              {user.role === 'cessca_staff' && (
                <Card title="Organizations Summary">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-sm font-medium text-gray-700">Total Organizations</span>
                      <span className="text-lg font-bold text-gray-900">
                        {dashboard.organizations?.total || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-sm font-medium text-gray-700">Active Organizations</span>
                      <span className="text-lg font-bold text-green-600">
                        {dashboard.organizations?.active || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-gray-700">Total Members</span>
                      <span className="text-lg font-bold text-primary-600">
                        {dashboard.organizations?.totalMembers || 0}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Quick Actions for Students */}
        {user.role === 'student' && (
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/organizations"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <FiUsers className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">Join Organizations</h3>
                <p className="text-sm text-gray-600">Browse and join student organizations</p>
              </a>
              <a
                href="/discipline"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <FiAlertCircle className="h-8 w-8 text-yellow-600 mb-2" />
                <h3 className="font-medium text-gray-900">Submit Concern</h3>
                <p className="text-sm text-gray-600">File a complaint or request consultation</p>
              </a>
              <a
                href="/sports"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <FiTrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">View Events</h3>
                <p className="text-sm text-gray-600">Check out upcoming sports and cultural events</p>
              </a>
            </div>
          </Card>
        )}

        {/* Quick Actions for Alumni */}
        {user.role === 'alumni' && (
          <Card title="Alumni Network">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/alumni"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <FiAward className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">Browse Alumni</h3>
                <p className="text-sm text-gray-600">Connect with fellow PTC graduates</p>
              </a>
              <a
                href="/profile"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <FiUsers className="h-8 w-8 text-accent-600 mb-2" />
                <h3 className="font-medium text-gray-900">My Profile</h3>
                <p className="text-sm text-gray-600">Update your profile and achievements</p>
              </a>
              <a
                href="/gallery"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <FiTrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Gallery</h3>
                <p className="text-sm text-gray-600">View memories from your PTC days</p>
              </a>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
