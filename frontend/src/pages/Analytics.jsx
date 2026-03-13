import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyticsService } from '../services/analyticsService';
import { 
  FiUsers, FiAward, FiFileText, FiHelpCircle, FiAlertCircle, 
  FiTrendingUp, FiDownload, FiCalendar, FiBarChart2 
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

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
        {/* Header */}
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

        {/* Key Metrics Grid */}
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
                    <p className="text-xs text-gray-500 mt-1">All registered users</p>
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
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboard.organizations?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Active organizations</p>
                  </div>
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <FiAward className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Service Requests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboard.serviceRequestStats?.reduce((acc, stat) => acc + stat.count, 0) || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dashboard.serviceRequestStats?.find(s => s.status === 'pending')?.count || 0} pending
                    </p>
                  </div>
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <FiFileText className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Help Desk Tickets</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboard.helpDeskStats?.reduce((acc, stat) => acc + stat.count, 0) || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dashboard.helpDeskStats?.find(s => s.status === 'open')?.count || 0} open
                    </p>
                  </div>
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <FiHelpCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="User Distribution by Role">
                <div className="space-y-4">
                  {dashboard.userStats?.map((stat) => (
                    <div key={stat.role} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          stat.role === 'student' ? 'bg-blue-500' :
                          stat.role === 'officer' ? 'bg-green-500' :
                          stat.role === 'cessca_staff' ? 'bg-purple-500' :
                          stat.role === 'admin' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {stat.role.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Organization Statistics">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm font-medium text-gray-700">Total Organizations</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {dashboard.organizations?.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm font-medium text-gray-700">Total Members</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {dashboard.organizations?.details?.reduce((acc, org) => acc + org.total_members, 0) || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-700">Avg Members/Org</span>
                    <span className="text-2xl font-bold text-green-600">
                      {dashboard.organizations?.total > 0 
                        ? Math.round((dashboard.organizations?.details?.reduce((acc, org) => acc + org.total_members, 0) || 0) / dashboard.organizations.total)
                        : 0
                      }
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Service Requests & Help Desk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Service Requests by Status">
                <div className="space-y-3">
                  {dashboard.serviceRequestStats?.map((stat) => (
                    <div key={stat.status} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {stat.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stat.status === 'pending' ? 'bg-yellow-500' :
                              stat.status === 'processing' ? 'bg-blue-500' :
                              stat.status === 'approved' ? 'bg-green-500' :
                              stat.status === 'completed' ? 'bg-primary-500' :
                              'bg-red-500'
                            }`}
                            style={{ 
                              width: `${(stat.count / (dashboard.serviceRequestStats?.reduce((acc, s) => acc + s.count, 0) || 1)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">{stat.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link to="/admin/service-requests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All Service Requests →
                  </Link>
                </div>
              </Card>

              <Card title="Help Desk Tickets by Status">
                <div className="space-y-3">
                  {dashboard.helpDeskStats?.map((stat) => (
                    <div key={stat.status} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {stat.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stat.status === 'open' ? 'bg-yellow-500' :
                              stat.status === 'in_progress' ? 'bg-blue-500' :
                              stat.status === 'resolved' ? 'bg-green-500' :
                              'bg-gray-500'
                            }`}
                            style={{ 
                              width: `${(stat.count / (dashboard.helpDeskStats?.reduce((acc, s) => acc + s.count, 0) || 1)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">{stat.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link to="/admin/help-desk" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All Tickets →
                  </Link>
                </div>
              </Card>
            </div>

            {/* Discipline & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Discipline Cases">
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

              <Card title="Upcoming Events">
                <div className="space-y-3">
                  {dashboard.upcomingEvents?.slice(0, 5).map((event) => (
                    <div key={event.event_id} className="flex items-start space-x-3 py-2 border-b last:border-0">
                      <FiCalendar className="mt-1 text-primary-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.event_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!dashboard.upcomingEvents || dashboard.upcomingEvents.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No upcoming events</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link to="/sports" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All Events →
                  </Link>
                </div>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card title="Recent Organization Activities">
              <div className="space-y-3">
                {dashboard.recentActivities?.slice(0, 10).map((activity) => (
                  <div key={activity.activity_id} className="flex items-start justify-between py-3 border-b last:border-0">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{activity.activity_title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">{activity.org_acronym}</span> • {activity.activity_type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.start_date).toLocaleDateString()} - {new Date(activity.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {activity.status}
                    </span>
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
