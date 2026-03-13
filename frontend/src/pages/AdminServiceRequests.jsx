import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { serviceRequestService } from '../services/serviceRequestService';
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
} from 'react-icons/fi';

const AdminServiceRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    request_type: '',
    priority: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    remarks: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [filters, currentPage]);

  const loadStatistics = async () => {
    try {
      const data = await serviceRequestService.getStatistics();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadRequests = async () => {
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

      const response = await serviceRequestService.getAllRequests(params);
      setRequests(response.requests);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load requests:', error);
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
      request_type: '',
      priority: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const openStatusModal = (request) => {
    setSelectedRequest(request);
    setStatusUpdate({
      status: request.status,
      remarks: '',
    });
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.status) return;

    try {
      setUpdating(true);
      await serviceRequestService.updateStatus(selectedRequest.request_id, statusUpdate);
      setShowStatusModal(false);
      loadRequests();
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
      pending: 'warning',
      processing: 'info',
      approved: 'success',
      rejected: 'danger',
      completed: 'primary',
      cancelled: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    return (
      <Badge variant={priority === 'urgent' ? 'danger' : 'default'}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatRequestType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const requestTypes = [
    { value: '', label: 'All Types' },
    { value: 'certificate_enrollment', label: 'Certificate of Enrollment' },
    { value: 'certificate_good_moral', label: 'Certificate of Good Moral' },
    { value: 'certificate_grades', label: 'Certificate of Grades' },
    { value: 'clearance', label: 'Clearance' },
    { value: 'id_replacement', label: 'ID Replacement' },
    { value: 'org_membership_certificate', label: 'Org Membership Certificate' },
    { value: 'event_participation_certificate', label: 'Event Participation Certificate' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manage Student Services</h1>
          <Button variant="outline" onClick={loadRequests}>
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_count}</p>
                </div>
                <FiFileText className="text-3xl text-blue-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pending_count}</p>
                </div>
                <FiClock className="text-3xl text-yellow-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.processing_count}</p>
                </div>
                <FiClock className="text-3xl text-purple-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.approved_count}</p>
                </div>
                <FiCheckCircle className="text-3xl text-green-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.rejected_count}</p>
                </div>
                <FiXCircle className="text-3xl text-red-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.completed_count}</p>
                </div>
                <FiCheckCircle className="text-3xl text-indigo-600" />
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
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
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>

              {/* Request Type Filter */}
              <div className="md:col-span-2">
                <select
                  value={filters.request_type}
                  onChange={(e) => handleFilterChange('request_type', e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {requestTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Requests Table */}
        <Card>
          {loading ? (
            <LoadingSpinner centered size="lg" />
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-xl text-gray-600">No requests found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.request_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{request.request_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatRequestType(request.request_type)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {request.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getPriorityBadge(request.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(request.requested_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/service-requests/${request.request_id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openStatusModal(request)}
                          >
                            Update
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

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Update Request Status
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Request #{selectedRequest.request_id}</p>
                  <p className="font-medium text-gray-900">{selectedRequest.student_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={statusUpdate.remarks}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, remarks: e.target.value })}
                    rows="3"
                    placeholder="Add any remarks or notes..."
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
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

export default AdminServiceRequests;
