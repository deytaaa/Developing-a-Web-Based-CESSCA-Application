import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { helpDeskService } from '../services/helpDeskService';
import { useAuth } from '../contexts/AuthContext';
import {
  FiArrowLeft,
  FiMessageCircle,
  FiClock,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiSend,
  FiUpload,
  FiDownload,
  FiX,
  FiStar,
} from 'react-icons/fi';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTicketDetails();
  }, [id]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await helpDeskService.getTicketDetails(id);
      setTicket(response.ticket);
    } catch (error) {
      console.error('Failed to load ticket details:', error);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!newResponse.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      await helpDeskService.addResponse(id, newResponse);
      setNewResponse('');
      setSuccessMessage('Response added successfully');
      loadTicketDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e, responseId = null) => {
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
      await helpDeskService.uploadAttachment(id, file, responseId);
      setSuccessMessage('File uploaded successfully');
      loadTicketDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket?')) {
      return;
    }

    try {
      setClosing(true);
      setError('');
      await helpDeskService.closeTicket(id);
      setSuccessMessage('Ticket closed successfully');
      loadTicketDetails();
      
      // Show rating modal if not already rated
      if (!ticket.satisfaction_rating) {
        setTimeout(() => setShowRatingModal(true), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close ticket');
    } finally {
      setClosing(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmittingRating(true);
      await helpDeskService.rateTicket(id, rating, ratingFeedback);
      setShowRatingModal(false);
      setSuccessMessage('Thank you for your feedback!');
      loadTicketDetails();
    } catch (err) {
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
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

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner centered size="lg" />
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto text-6xl text-red-500 mb-4" />
            <p className="text-xl text-gray-900 mb-2">Ticket not found</p>
            <Button variant="primary" onClick={() => {
              if (['cessca_staff', 'admin'].includes(user.role)) {
                navigate('/admin/help-desk');
              } else {
                navigate('/help-desk');
              }
            }}>
              Back to Support Center
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  const canClose = ticket.status !== 'closed' && ticket.user_id === user?.user_id;
  const canRespond = ticket.status !== 'closed';
  const canRate = ticket.status === 'closed' && !ticket.satisfaction_rating && ticket.user_id === user?.user_id;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (['cessca_staff', 'admin'].includes(user.role)) {
                  navigate('/admin/help-desk');
                } else {
                  navigate('/help-desk');
                }
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="text-2xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{ticket.subject}</h1>
              <p className="text-gray-600 mt-1">Ticket: {ticket.ticket_number}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
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
          {/* Main Content - Conversation Thread */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Ticket */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUser className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{ticket.student_name}</p>
                        <p className="text-sm text-gray-500">{formatDate(ticket.created_at)}</p>
                      </div>
                      <Badge variant="primary">{ticket.category.toUpperCase()}</Badge>
                    </div>
                    <div className="mt-3 bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                    
                    {/* Original Attachments */}
                    {ticket.attachments && ticket.attachments.filter(a => !a.response_id).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Attachments:</p>
                        {ticket.attachments.filter(a => !a.response_id).map((attachment) => (
                          <div
                            key={attachment.attachment_id}
                            className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded"
                          >
                            <span className="text-sm text-gray-900">{attachment.file_name}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              <FiDownload />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Responses */}
            {ticket.responses && ticket.responses.length > 0 && (
              <div className="space-y-4">
                {ticket.responses.map((response) => (
                  <Card key={response.response_id}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        response.is_staff ? 'bg-green-100' : 'bg-primary-100'
                      }`}>
                        <FiUser className={response.is_staff ? 'text-green-600' : 'text-primary-600'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {response.responder_name}
                              {response.is_staff && (
                                <Badge variant="success" className="ml-2">STAFF</Badge>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{formatDate(response.created_at)}</p>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-900 whitespace-pre-wrap">{response.message}</p>
                        </div>

                        {/* Response Attachments */}
                        {ticket.attachments && ticket.attachments.filter(a => a.response_id === response.response_id).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {ticket.attachments.filter(a => a.response_id === response.response_id).map((attachment) => (
                              <div
                                key={attachment.attachment_id}
                                className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded"
                              >
                                <span className="text-sm text-gray-900">{attachment.file_name}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadAttachment(attachment)}
                                >
                                  <FiDownload />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Response Form */}
            {canRespond && (
              <Card title="Add Response">
                <form onSubmit={handleResponseSubmit} className="space-y-4">
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    rows="4"
                    placeholder="Type your response here..."
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" disabled={uploading}>
                        {uploading ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span> Uploading...
                          </>
                        ) : (
                          <>
                            <FiUpload className="mr-2" /> Attach File
                          </>
                        )}
                      </Button>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        onChange={(e) => handleFileUpload(e)}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <Button type="submit" variant="primary" disabled={submitting || !newResponse.trim()}>
                      {submitting ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span> Sending...
                        </>
                      ) : (
                        <>
                          <FiSend className="mr-2" /> Send Response
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Show Rating if can rate */}
            {canRate && (
              <Card>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <FiStar className="mx-auto text-4xl text-blue-600 mb-2" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Rate Your Experience</h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Help us improve by rating your support experience
                  </p>
                  <Button variant="primary" onClick={() => setShowRatingModal(true)}>
                    Rate Now
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card title="Ticket Information">
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(ticket.status)}</div>
                </div>
                <div>
                  <label className="text-gray-500">Priority</label>
                  <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
                </div>
                <div>
                  <label className="text-gray-500">Category</label>
                  <p className="text-gray-900 mt-1">{ticket.category.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-gray-500">Created</label>
                  <p className="text-gray-900 mt-1">{formatDate(ticket.created_at)}</p>
                </div>
                {ticket.assigned_to_name && (
                  <div>
                    <label className="text-gray-500">Assigned To</label>
                    <p className="text-gray-900 mt-1">{ticket.assigned_to_name}</p>
                  </div>
                )}
                {ticket.satisfaction_rating && (
                  <div>
                    <label className="text-gray-500">Your Rating</label>
                    <div className="mt-1 flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`${
                            i < ticket.satisfaction_rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            {canClose && (
              <Card title="Actions">
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={handleCloseTicket}
                  disabled={closing}
                >
                  {closing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> Closing...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" /> Close Ticket
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Close the ticket when your issue is resolved
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Rate Your Support Experience
              </h3>

              <div className="space-y-4">
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <FiStar
                        className={`text-4xl ${
                          star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Feedback (Optional)
                  </label>
                  <textarea
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    rows="3"
                    placeholder="Tell us about your experience..."
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowRatingModal(false)}
                    disabled={submittingRating}
                  >
                    Skip
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRatingSubmit}
                    disabled={submittingRating || rating === 0}
                  >
                    {submittingRating ? 'Submitting...' : 'Submit Rating'}
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

export default TicketDetails;
