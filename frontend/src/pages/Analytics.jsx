import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyticsService } from '../services/analyticsService';
import { FiUsers, FiAward, FiAlertCircle, FiDownload, FiCalendar } from 'react-icons/fi';

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.getDashboard();
        setDashboard(response.dashboard);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedPeriod]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="mt-1 text-gray-600">Comprehensive system statistics and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
            <Button variant="outline">
              <FiDownload className="mr-2" /> Export Report
            </Button>
          </div>
        </div>

        {dashboard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="!p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboard.userStats?.reduce((acc, stat) => acc + stat.count, 0) || 0}
                    </p>
                  </div>
                  <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                    <FiUsers className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.organizations?.total || 0}</p>
                  </div>
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <FiAward className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Discipline Cases</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboard.disciplineStats?.reduce((acc, stat) => acc + stat.count, 0) || 0}
                    </p>
                  </div>
                  <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                    <FiAlertCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.upcomingEvents?.length || 0}</p>
                  </div>
                  <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                    <FiCalendar className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="User Distribution by Role">
                <div className="space-y-4">
                  {dashboard.userStats?.map((stat) => (
                    <div key={`${stat.role}-${stat.status}`} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {stat.role.replace('_', ' ')} ({stat.status})
                      </span>
                      <span className="text-lg font-bold text-gray-900">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Discipline Cases by Status">
                <div className="space-y-3">
                  {dashboard.disciplineStats?.map((stat) => (
                    <div key={stat.status} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium text-gray-700 capitalize">{stat.status}</span>
                      <span className="text-lg font-bold text-gray-900">{stat.count}</span>
                    </div>
                  ))}
                  {(!dashboard.disciplineStats || dashboard.disciplineStats.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No discipline cases</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link to="/discipline" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All Cases →
                  </Link>
                </div>
              </Card>
            </div>

            <Card title="Upcoming Organization Activities">
              <div className="space-y-3">
                {dashboard.recentActivities?.slice(0, 10).map((activity) => (
                  <div key={activity.activity_id} className="flex items-start justify-between py-3 border-b last:border-0">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{activity.activity_title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">{activity.org_acronym}</span> • {activity.activity_type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">{activity.status}</span>
                  </div>
                ))}
                {(!dashboard.recentActivities || dashboard.recentActivities.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No recent activities</p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
