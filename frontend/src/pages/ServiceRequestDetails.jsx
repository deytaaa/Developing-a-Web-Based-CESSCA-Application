import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { serviceRequestService } from '../services/serviceRequestService';
import { useAuth } from '../contexts/AuthContext';
import {
  FiArrowLeft,
  FiFileText,
  FiClock,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiUpload,
  FiX,
} from 'react-icons/fi';

const ServiceRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequestDetails();
  }, [id]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await serviceRequestService.getRequestDetails(id);
      // Combine request with attachments and logs
      setRequest({
        ...response.request,
        attachments: response.attachments || [],
        logs: response.logs || []
      });
    } catch (error) {
      console.error('Failed to load request details:', error);
      setError('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await serviceRequestService.uploadAttachment(id, file);
      setSuccessMessage('File uploaded successfully');
      loadRequestDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      setCancelling(true);
      setError('');
      await serviceRequestService.cancelRequest(id);
      setSuccessMessage('Request cancelled successfully');
      loadRequestDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
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

  const formatRequestType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadAttachment = (attachment) => {
    window.open(`http://localhost:5000${attachment.file_path}`, '_blank');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'processing':
        return <FiClock className="text-blue-600" />;
      case 'approved':
        return <FiCheckCircle className="text-green-600" />;
      case 'rejected':
        return <FiXCircle className="text-red-600" />;
      case 'completed':
        return <FiCheckCircle className="text-indigo-600" />;
      case 'cancelled':
        return <FiXCircle className="text-gray-600" />;
      default:
        return <FiAlertCircle className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner centered size="lg" />
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto text-6xl text-red-500 mb-4" />
            <p className="text-xl text-gray-900 mb-2">Request not found</p>
            <Button variant="primary" onClick={() => navigate('/service-requests')}>
              Back to Student Services
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  const canCancel = request.status === 'pending' && request.user_id === user?.user_id;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (['cessca_staff', 'admin'].includes(user.role)) {
                  navigate('/admin/service-requests');
                } else {
                  navigate('/service-requests');
                }
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="text-2xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request #{request.request_id}</h1>
              <p className="text-gray-600 mt-1">{formatRequestType(request.request_type)}</p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">
              <FiX />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              <FiX />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Information */}
            <Card title="Request Information">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Purpose</label>
                  <p className="mt-1 text-gray-900">{request.purpose}</p>
                </div>

                {request.additional_details && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Additional Details</label>
                    <p className="mt-1 text-gray-900">{request.additional_details}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <p className="mt-1">
                      <Badge variant={request.priority === 'urgent' ? 'danger' : 'default'}>
                        {request.priority.toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Requested Date</label>
                    <p className="mt-1 text-gray-900">{formatDate(request.requested_date)}</p>
                  </div>
                </div>

                {request.estimated_completion && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estimated Completion</label>
                    <p className="mt-1 text-gray-900">{formatDate(request.estimated_completion)}</p>
                  </div>
                )}

                {request.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <label className="text-sm font-medium text-red-800">Rejection Reason</label>
                    <p className="mt-1 text-red-900">{request.rejection_reason}</p>
                  </div>
                )}

                {request.staff_remarks && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="text-sm font-medium text-blue-800">Staff Remarks</label>
                    <p className="mt-1 text-blue-900">{request.staff_remarks}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Attachments */}
            <Card
              title="Attachments"
              action={
                request.status === 'pending' && (
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" disabled={uploading}>
                      {uploading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span> Uploading...
                        </>
                      ) : (
                        <>
                          <FiUpload className="mr-2" /> Add File
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )
              }
            >
              {request.attachments && request.attachments.length > 0 ? (
                <div className="space-y-2">
                  {request.attachments.map((attachment) => (
                    <div
                      key={attachment.attachment_id}
                      className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FiFileText className="text-gray-400 text-xl" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {(attachment.file_size / 1024).toFixed(2)} KB • Uploaded on {formatDate(attachment.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttachment(attachment)}
                      >
                        <FiDownload className="mr-2" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No attachments</p>
              )}
            </Card>

            {/* Activity Log */}
            {request.logs && request.logs.length > 0 && (
              <Card title="Activity Log">
                <div className="space-y-4">
                  {request.logs.map((log, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          {getStatusIcon(log.new_status)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Status changed to: {log.new_status ? log.new_status.replace('_', ' ').toUpperCase() : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(log.created_at)}</p>
                        </div>
                        {log.first_name && log.last_name && (
                          <p className="text-xs text-gray-600 mt-1">
                            By: {log.first_name} {log.last_name}
                          </p>
                        )}
                        {log.remarks && (
                          <p className="text-sm text-gray-700 mt-1 bg-gray-50 px-3 py-2 rounded">
                            {log.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card title="Quick Info">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <FiUser className="text-gray-400" />
                  <span className="text-gray-900">{request.student_name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <FiCalendar className="text-gray-400" />
                  <span className="text-gray-900">{formatDate(request.requested_date)}</span>
                </div>
                {request.processed_by_name && (
                  <div className="flex items-center space-x-2 text-sm">
                    <FiUser className="text-gray-400" />
                    <div>
                      <span className="text-gray-500">Processed by: </span>
                      <span className="text-gray-900">{request.processed_by_name}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment Info */}
            {(request.payment_amount || request.payment_status) && (
              <Card title="Payment Information">
                <div className="space-y-2">
                  {request.payment_amount && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Amount</label>
                      <p className="text-lg font-bold text-gray-900">₱{request.payment_amount}</p>
                    </div>
                  )}
                  {request.payment_status && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="mt-1">
                        <Badge variant={request.payment_status === 'paid' ? 'success' : 'warning'}>
                          {request.payment_status.toUpperCase()}
                        </Badge>
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Actions */}
            {canCancel && (
              <Card title="Actions">
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={handleCancelRequest}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Cancelling...
                    </>
                  ) : (
                    <>
                      <FiXCircle className="mr-2" /> Cancel Request
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  You can only cancel pending requests
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceRequestDetails;
