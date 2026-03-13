import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';
import { FiUsers, FiAward, FiAlertCircle, FiTrendingUp, FiFileText, FiHelpCircle, FiBarChart2, FiImage, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';

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

        {/* Stats Grid for Staff/Admin */}
        {dashboard && ['cessca_staff', 'admin'].includes(user.role) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <FiFileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Service Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.serviceRequestStats?.find(s => s.status === 'pending')?.count || 0}
                    </p>
                    <Link to="/admin/service-requests" className="text-xs text-blue-600 hover:underline">View all →</Link>
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <FiHelpCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open Support Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.helpDeskStats?.find(s => s.status === 'open')?.count || 0}
                    </p>
                    <Link to="/admin/help-desk" className="text-xs text-purple-600 hover:underline">View all →</Link>
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
                    <Link to="/discipline" className="text-xs text-yellow-600 hover:underline">View all →</Link>
                  </div>
                </div>
              </Card>

              <Card className="!p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <FiAward className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Orgs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.organizations?.total || 0}
                    </p>
                    <Link to="/organizations" className="text-xs text-green-600 hover:underline">View all →</Link>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Links for Staff/Admin */}
            <Card title="Quick Access">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/analytics" className="block">
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center">
                    <div className="flex justify-center mb-2">
                      <div className="bg-indigo-100 rounded-lg p-3">
                        <FiBarChart2 className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Analytics</p>
                    <p className="text-xs text-gray-500 mt-1">Detailed reports</p>
                  </div>
                </Link>

                <Link to="/gallery" className="block">
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center">
                    <div className="flex justify-center mb-2">
                      <div className="bg-pink-100 rounded-lg p-3">
                        <FiImage className="h-6 w-6 text-pink-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Gallery</p>
                    <p className="text-xs text-gray-500 mt-1">Photo management</p>
                  </div>
                </Link>

                <Link to="/sports" className="block">
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center">
                    <div className="flex justify-center mb-2">
                      <div className="bg-gold-100 rounded-lg p-3">
                        <FiTrendingUp className="h-6 w-6 text-gold-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Sports & Arts</p>
                    <p className="text-xs text-gray-500 mt-1">Events & programs</p>
                  </div>
                </Link>

                <Link to="/activities" className="block">
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center">
                    <div className="flex justify-center mb-2">
                      <div className="bg-blue-100 rounded-lg p-3">
                        <FiCalendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Activities</p>
                    <p className="text-xs text-gray-500 mt-1">{dashboard.upcomingEvents?.length || 0} upcoming</p>
                  </div>
                </Link>
              </div>
            </Card>

            {/* Pending Items for Admin */}
            {user.role === 'admin' && dashboard.pendingRegistrations?.length > 0 && (
              <Card title="Pending User Registrations">
                <div className="space-y-3">
                  {dashboard.pendingRegistrations.slice(0, 5).map((pendingUser) => (
                    <div key={pendingUser.user_id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">
                          {pendingUser.first_name} {pendingUser.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{pendingUser.email}</p>
                      </div>
                      <Badge variant="warning">{pendingUser.role}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link to="/admin" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All Pending Users →
                  </Link>
                </div>
              </Card>
            )}

            {/* Recent Activities */}
            {dashboard.recentActivities?.length > 0 && (
              <Card title="Upcoming Organization Activities">
                <div className="space-y-3">
                  {dashboard.recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.activity_id} className="flex items-start justify-between py-2 border-b last:border-0">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{activity.activity_title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{activity.org_acronym}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link to="/activities" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View All Activities →
                  </Link>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Quick Actions for Students */}
        {user.role === 'student' && (
          <>
            {/* Student Statistics */}
            {dashboard && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="!p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                        <FiUsers className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Organizations</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboard.organizations?.length || 0}
                        </p>
                        <Link to="/organizations" className="text-xs text-blue-600 hover:underline">View all →</Link>
                      </div>
                    </div>
                  </Card>

                  <Card className="!p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                        <FiFileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Student Services</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboard.serviceRequests?.stats?.reduce((acc, s) => acc + s.count, 0) || 0}
                        </p>
                        <Link to="/service-requests" className="text-xs text-green-600 hover:underline">View all →</Link>
                      </div>
                    </div>
                  </Card>

                  <Card className="!p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                        <FiHelpCircle className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Support Center</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboard.helpDesk?.stats?.reduce((acc, s) => acc + s.count, 0) || 0}
                        </p>
                        <Link to="/help-desk" className="text-xs text-purple-600 hover:underline">View all →</Link>
                      </div>
                    </div>
                  </Card>

                  <Card className="!p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                        <FiCalendar className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {(dashboard.upcomingActivities?.length || 0) + (dashboard.upcomingSports?.length || 0)}
                        </p>
                        <Link to="/activities" className="text-xs text-yellow-600 hover:underline">View calendar →</Link>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recent Activities Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Student Services */}
                  {dashboard.serviceRequests?.recent?.length > 0 && (
                    <Card title="Recent Student Services">
                      <div className="space-y-3">
                        {dashboard.serviceRequests.recent.map((request) => (
                          <Link
                            key={request.request_id}
                            to={`/service-requests/${request.request_id}`}
                            className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 px-2 rounded transition"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{request.request_type.replace('_', ' ')}</p>
                              <p className="text-xs text-gray-600 mt-1">{request.purpose}</p>
                            </div>
                            <Badge variant={
                              request.status === 'completed' ? 'success' : 
                              request.status === 'approved' ? 'success' :
                              request.status === 'processing' ? 'info' : 
                              request.status === 'rejected' ? 'danger' : 'warning'
                            }>
                              {request.status}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Link to="/service-requests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          View All Requests →
                        </Link>
                      </div>
                    </Card>
                  )}

                  {/* Upcoming Organization Activities */}
                  {dashboard.upcomingActivities?.length > 0 && (
                    <Card title="Upcoming Organization Activities">
                      <div className="space-y-3">
                        {dashboard.upcomingActivities.slice(0, 5).map((activity) => (
                          <div key={activity.activity_id} className="flex items-start justify-between py-2 border-b last:border-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{activity.activity_title}</p>
                              <p className="text-xs text-gray-600 mt-1">{activity.org_acronym}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.start_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Link to="/activities" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          View All Activities →
                        </Link>
                      </div>
                    </Card>
                  )}

                  {/* Upcoming Sports Events */}
                  {dashboard.upcomingSports?.length > 0 && (
                    <Card title="Upcoming Sports & Events">
                      <div className="space-y-3">
                        {dashboard.upcomingSports.map((event) => (
                          <div key={event.event_id} className="flex items-start justify-between py-2 border-b last:border-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{event.event_name}</p>
                              <p className="text-xs text-gray-600 mt-1">{event.event_type}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(event.event_date).toLocaleDateString()} • {event.venue}
                              </p>
                            </div>
                            <Badge variant="info">{event.status.replace('_', ' ')}</Badge>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Link to="/sports" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          View All Events →
                        </Link>
                      </div>
                    </Card>
                  )}

                  {/* Recent Support Tickets */}
                  {dashboard.helpDesk?.recent?.length > 0 && (
                    <Card title="Recent Support Tickets">
                      <div className="space-y-3">
                        {dashboard.helpDesk.recent.map((ticket) => (
                          <Link
                            key={ticket.ticket_id}
                            to={`/help-desk/${ticket.ticket_id}`}
                            className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 px-2 rounded transition"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                              <p className="text-xs text-gray-600 mt-1">Ticket #{ticket.ticket_number}</p>
                            </div>
                            <Badge variant={
                              ticket.status === 'closed' ? 'success' : 
                              ticket.status === 'in_progress' ? 'info' : 'warning'
                            }>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Link to="/help-desk" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          View All Tickets →
                        </Link>
                      </div>
                    </Card>
                  )}
                </div>

                {/* My Organizations */}
                {dashboard.organizations?.length > 0 && (
                  <Card title="My Organizations">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {dashboard.organizations.map((org) => (
                        <Link
                          key={org.org_id}
                          to={`/organizations/${org.org_id}`}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all"
                        >
                          <div className="text-center">
                            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <FiUsers className="h-6 w-6 text-primary-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{org.org_acronym}</h3>
                            <p className="text-xs text-gray-600 mb-2">{org.org_name}</p>
                            <Badge variant="success" className="text-xs">Member</Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Link to="/organizations" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Browse All Organizations →
                      </Link>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Link
                  to="/service-requests/new"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <FiFileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">New Request</p>
                  <p className="text-xs text-gray-500 mt-1">Request student services</p>
                </Link>

                <Link
                  to="/help-desk/new"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="bg-purple-100 rounded-lg p-3">
                      <FiHelpCircle className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Get Help</p>
                  <p className="text-xs text-gray-500 mt-1">Open a support ticket</p>
                </Link>

                <Link
                  to="/organizations"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="bg-green-100 rounded-lg p-3">
                      <FiUsers className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Organizations</p>
                  <p className="text-xs text-gray-500 mt-1">Join or browse</p>
                </Link>

                <Link
                  to="/discipline"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="bg-yellow-100 rounded-lg p-3">
                      <FiAlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Submit Concern</p>
                  <p className="text-xs text-gray-500 mt-1">File a complaint</p>
                </Link>

                <Link
                  to="/sports"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="bg-gold-100 rounded-lg p-3">
                      <FiTrendingUp className="h-6 w-6 text-gold-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Sports & Arts</p>
                  <p className="text-xs text-gray-500 mt-1">View events</p>
                </Link>
              </div>
            </Card>
          </>
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
