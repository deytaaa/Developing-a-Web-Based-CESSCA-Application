import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { helpDeskService } from '../services/helpDeskService';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus, FiMessageCircle, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const HelpDesk = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statistics, setStatistics] = useState({
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter, currentPage]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }

      const response = await helpDeskService.getMyTickets(params);
      setTickets(response.tickets);
      setTotalPages(response.pagination.totalPages);
      
      // Calculate statistics from tickets
      const stats = {
        open: response.tickets.filter(t => t.status === 'open').length,
        in_progress: response.tickets.filter(t => t.status === 'in_progress').length,
        resolved: response.tickets.filter(t => t.status === 'resolved').length,
        closed: response.tickets.filter(t => t.status === 'closed').length,
      };
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'warning',
      in_progress: 'info',
      resolved: 'success',
      closed: 'default',
      reopened: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'default',
      normal: 'info',
      high: 'warning',
      urgent: 'danger',
    };
    return <Badge variant={variants[priority] || 'default'}>{priority.toUpperCase()}</Badge>;
  };

  const getCategoryBadge = (category) => {
    return <Badge variant="primary">{category.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'technical', label: 'Technical' },
    { value: 'organization', label: 'Organization' },
    { value: 'event', label: 'Event' },
    { value: 'academic', label: 'Academic' },
    { value: 'facility', label: 'Facility' },
    { value: 'general', label: 'General' },
    { value: 'feedback', label: 'Feedback' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          {user?.role === 'student' || user?.role === 'officer' ? (
            <Link to="/help-desk/new">
              <Button variant="primary">
                <FiPlus className="mr-2" /> New Ticket
              </Button>
            </Link>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Staff and admins cannot submit tickets. Use <Link to="/admin/help-desk" className="text-blue-600 hover:underline">Admin Panel</Link> to manage tickets.
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.open}</p>
              </div>
              <FiAlertCircle className="text-3xl text-yellow-600" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.in_progress}</p>
              </div>
              <FiClock className="text-3xl text-blue-600" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.resolved}</p>
              </div>
              <FiCheckCircle className="text-3xl text-green-600" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.closed}</p>
              </div>
              <FiCheckCircle className="text-3xl text-gray-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Tickets List */}
        <Card>
          {loading ? (
            <LoadingSpinner centered size="lg" />
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <FiMessageCircle className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-xl text-gray-600 mb-2">No tickets found</p>
              {user?.role === 'student' || user?.role === 'officer' ? (
                <>
                  <p className="text-gray-500 mb-6">Submit a new ticket to get help</p>
                  <Link to="/help-desk/new">
                    <Button variant="primary">
                      <FiPlus className="mr-2" /> New Ticket
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-gray-500 mb-6">No tickets submitted by students yet</p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/help-desk/${ticket.ticket_id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {ticket.subject}
                          </h3>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          {getCategoryBadge(ticket.category)}
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FiMessageCircle className="mr-1" />
                            Ticket: {ticket.ticket_number}
                          </span>
                          <span className="flex items-center">
                            <FiClock className="mr-1" />
                            {formatDate(ticket.created_at)}
                          </span>
                          {ticket.assigned_to_name && (
                            <span>
                              Assigned to: {ticket.assigned_to_name}
                            </span>
                          )}
                          {ticket.response_count > 0 && (
                            <span className="flex items-center">
                              <FiMessageCircle className="mr-1" />
                              {ticket.response_count} {ticket.response_count === 1 ? 'response' : 'responses'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 mt-6">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default HelpDesk;
