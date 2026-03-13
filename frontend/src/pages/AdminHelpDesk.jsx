import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { helpDeskService } from '../services/helpDeskService';
import {
  FiMessageCircle,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiUser,
} from 'react-icons/fi';

const AdminHelpDesk = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [assignableStaff, setAssignableStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    assigned: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignToId, setAssignToId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadStatistics();
    loadAssignableStaff();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters, currentPage]);

  const loadStatistics = async () => {
    try {
      const data = await helpDeskService.getStatistics();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadAssignableStaff = async () => {
    try {
      const data = await helpDeskService.getAvailableStaff();
      setAssignableStaff(data.staff);
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 15,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await helpDeskService.getAllTickets(params);
      setTickets(response.tickets);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      search: value,
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      priority: '',
      assigned: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const openAssignModal = (ticket) => {
    setSelectedTicket(ticket);
    setAssignToId(ticket.assigned_to || '');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignToId) return;

    try {
      setAssigning(true);
      await helpDeskService.assignTicket(selectedTicket.ticket_id, assignToId);
      setShowAssignModal(false);
      loadTickets();
      loadStatistics();
      loadAssignableStaff();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      alert('Failed to assign ticket. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const openStatusModal = (ticket) => {
    setSelectedTicket(ticket);
    setStatusUpdate(ticket.status);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return;

    try {
      setUpdating(true);
      await helpDeskService.updateStatus(selectedTicket.ticket_id, statusUpdate);
      setShowStatusModal(false);
      loadTickets();
      loadStatistics();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const categories = [
    { value: '', label: 'All Categories' },
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Support Center</h1>
          <Button variant="outline" onClick={loadTickets}>
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_tickets}</p>
                </div>
                <FiMessageCircle className="text-2xl text-blue-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.open_tickets}</p>
                </div>
                <FiClock className="text-2xl text-yellow-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.in_progress_tickets}</p>
                </div>
                <FiClock className="text-2xl text-purple-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.resolved_tickets}</p>
                </div>
                <FiCheckCircle className="text-2xl text-green-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Closed</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.closed_tickets}</p>
                </div>
                <FiCheckCircle className="text-2xl text-indigo-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.urgent_tickets || 0}</p>
                </div>
                <FiClock className="text-2xl text-red-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-teal-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.avg_satisfaction_rating ? parseFloat(statistics.avg_satisfaction_rating).toFixed(1) : 'N/A'}
                  </p>
                </div>
                <FiCheckCircle className="text-2xl text-teal-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Unassigned</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.unassigned_tickets || 0}</p>
                </div>
                <FiUser className="text-2xl text-orange-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiFilter className="mr-2" /> Filters
              </h3>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by ticket number, subject, or student..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="reopened">Reopened</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {/* Assignment Filter */}
              <select
                value={filters.assigned}
                onChange={(e) => handleFilterChange('assigned', e.target.value)}
                className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Assignments</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
              </select>

              {/* Category Filter */}
              <div className="md:col-span-2">
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
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

        {/* Tickets Table */}
        <Card>
          {loading ? (
            <LoadingSpinner centered size="lg" />
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <FiMessageCircle className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-xl text-gray-600">No tickets found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr key={ticket.ticket_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.ticket_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {ticket.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant="primary">{ticket.category.toUpperCase()}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getPriorityBadge(ticket.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {ticket.assigned_to_name || (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(ticket.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/help-desk/${ticket.ticket_id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openAssignModal(ticket)}
                          >
                            Assign
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => openStatusModal(ticket)}
                          >
                            Status
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 mt-4">
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

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Assign Ticket
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Ticket: {selectedTicket.ticket_number}
                  </p>
                  <p className="font-medium text-gray-900">{selectedTicket.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={assignToId}
                    onChange={(e) => setAssignToId(e.target.value)}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select staff member</option>
                    {assignableStaff.map((staff) => (
                      <option key={staff.user_id} value={staff.user_id}>
                        {staff.full_name} ({staff.assigned_tickets_count} tickets)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignModal(false)}
                    disabled={assigning}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAssign}
                    disabled={assigning || !assignToId}
                  >
                    {assigning ? 'Assigning...' : 'Assign Ticket'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Update Ticket Status
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Ticket: {selectedTicket.ticket_number}
                  </p>
                  <p className="font-medium text-gray-900">{selectedTicket.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="reopened">Reopened</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleStatusUpdate}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminHelpDesk;
