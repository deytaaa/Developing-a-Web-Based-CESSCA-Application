import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { serviceRequestService } from '../services/serviceRequestService';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus, FiFileText, FiClock, FiCheckCircle, FiXCircle, FiFilter } from 'react-icons/fi';

const ServiceRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [statistics, setStatistics] = useState({
    total_count: 0,
    pending_count: 0,
    processing_count: 0,
    approved_count: 0,
    rejected_count: 0,
    completed_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRequests();
  }, [statusFilter, currentPage]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await serviceRequestService.getMyRequests(params);
      setRequests(response.requests);
      setStatistics(response.statistics);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Student Services</h1>
          {user?.role === 'student' || user?.role === 'officer' ? (
            <Link to="/service-requests/new">
              <Button variant="primary">
                <FiPlus className="mr-2" /> New Request
              </Button>
            </Link>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Staff and admins cannot submit requests. Use <Link to="/admin/service-requests" className="text-blue-600 hover:underline">Admin Panel</Link> to manage requests.
            </div>
          )}
        </div>

        {/* Statistics Cards */}
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

        {/* Filters */}
        <Card>
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('pending');
                setCurrentPage(1);
              }}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'processing' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('processing');
                setCurrentPage(1);
              }}
            >
              Processing
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('approved');
                setCurrentPage(1);
              }}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('completed');
                setCurrentPage(1);
              }}
            >
              Completed
            </Button>
          </div>
        </Card>

        {/* Requests List */}
        <Card>
          {loading ? (
            <LoadingSpinner centered size="lg" />
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-xl text-gray-600 mb-2">No student service requests found</p>
              {user?.role === 'student' || user?.role === 'officer' ? (
                <>
                  <p className="text-gray-500 mb-6">Submit your first request to get started</p>
                  <Link to="/service-requests/new">
                    <Button variant="primary">
                      <FiPlus className="mr-2" /> New Request
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-gray-500 mb-6">No requests submitted by students yet</p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request ID
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
                        Requested Date
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/service-requests/${request.request_id}`)}
                          >
                            View Details
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
      </div>
    </Layout>
  );
};

export default ServiceRequests;
