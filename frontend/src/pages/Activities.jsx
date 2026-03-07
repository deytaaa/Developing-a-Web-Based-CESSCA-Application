import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { organizationService } from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiCalendar, FiMapPin, FiClock, FiUsers, FiDollarSign, 
  FiPlus, FiX, FiCheck, FiXCircle, FiAlertCircle,
  FiFilter, FiFileText, FiTrash2
} from 'react-icons/fi';

const Activities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    orgId: '',
    activityTitle: '',
    description: '',
    activityType: 'seminar',
    venue: '',
    startDate: '',
    endDate: '',
    targetParticipants: '',
    budget: ''
  });

  // Review state
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    remarks: ''
  });

  const isOfficer = user?.role === 'officer';
  const isCessca = user?.role === 'cessca_staff' || user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load organizations based on role
      if (isOfficer || isCessca) {
        let orgsData;
        
        if (isOfficer) {
          // Officers only see organizations they're officers of
          orgsData = await organizationService.getMyOfficerOrganizations();
        } else {
          // CESSCA/Admin see all organizations
          orgsData = await organizationService.getAll();
        }
        
        setOrganizations(orgsData.organizations || orgsData || []);
        
        // Load all activities from relevant organizations
        const allActivities = [];
        const orgList = orgsData.organizations || orgsData || [];
        
        for (const org of orgList) {
          try {
            const activitiesData = await organizationService.getActivities(org.org_id);
            const orgActivities = (activitiesData.activities || activitiesData || []).map(activity => ({
              ...activity,
              org_name: org.org_name,
              org_acronym: org.org_acronym
            }));
            allActivities.push(...orgActivities);
          } catch (error) {
            console.error(`Error loading activities for org ${org.org_id}:`, error);
          }
        }
        
        setActivities(allActivities);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitActivity = async (e) => {
    e.preventDefault();
    
    if (!formData.orgId) {
      alert('Please select an organization');
      return;
    }

    try {
      await organizationService.submitActivity(formData.orgId, {
        activityTitle: formData.activityTitle,
        description: formData.description,
        activityType: formData.activityType,
        venue: formData.venue,
        startDate: formData.startDate,
        endDate: formData.endDate,
        targetParticipants: parseInt(formData.targetParticipants) || null,
        budget: parseFloat(formData.budget) || null
      });
      
      alert('Activity proposal submitted successfully!');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error submitting activity:', error);
      alert(error.response?.data?.message || 'Failed to submit activity');
    }
  };

  const handleReviewActivity = async (e) => {
    e.preventDefault();
    
    try {
      await organizationService.reviewActivity(
        selectedActivity.activity_id,
        reviewData.status,
        reviewData.remarks
      );
      
      alert(`Activity ${reviewData.status} successfully!`);
      setShowReviewModal(false);
      setSelectedActivity(null);
      setReviewData({ status: 'approved', remarks: '' });
      loadData();
    } catch (error) {
      console.error('Error reviewing activity:', error);
      alert('Failed to review activity');
    }
  };

  const openReviewModal = (activity) => {
    setSelectedActivity(activity);
    setReviewData({ status: 'approved', remarks: '' });
    setShowReviewModal(true);
  };

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await organizationService.deleteActivity(activityId);
      alert('Activity deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete activity';
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      orgId: '',
      activityTitle: '',
      description: '',
      activityType: 'seminar',
      venue: '',
      startDate: '',
      endDate: '',
      targetParticipants: '',
      budget: ''
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'completed': return 'info';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FiCheck className="inline" />;
      case 'rejected': return <FiXCircle className="inline" />;
      case 'pending': return <FiAlertCircle className="inline" />;
      default: return null;
    }
  };

  const filteredActivities = filterStatus === 'all' 
    ? activities 
    : activities.filter(a => a.status === filterStatus);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading activities...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Activities</h1>
            <p className="text-gray-600 mt-1">
              {isOfficer && 'Submit and manage organization activity proposals'}
              {isCessca && 'Review and approve organization activities'}
            </p>
          </div>
          
          {isOfficer && organizations.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FiPlus className="mr-2" />
              Submit Activity
            </button>
          )}
        </div>

        {/* No Organizations Assigned Warning for Officers */}
        {isOfficer && organizations.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <FiAlertCircle className="text-6xl mx-auto mb-4 text-yellow-500" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Not Assigned to Any Organization</h3>
              <p className="text-gray-600 mb-4">
                You need to be appointed as an officer of an organization by CESSCA staff or Admin before you can submit activities.
              </p>
              <p className="text-sm text-gray-500">
                Contact CESSCA administration to be assigned as an officer of your organization.
              </p>
            </div>
          </Card>
        )}

        {/* Show filters and activities only if has organizations */}
        {(isCessca || (isOfficer && organizations.length > 0)) && (
          <>
        {/* Filters */}
        <Card>
          <div className="flex items-center space-x-4">
            <FiFilter className="text-gray-500" />
            <div className="flex space-x-2">
              {['all', 'pending', 'approved', 'rejected', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    filterStatus === status
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                  {status === 'all' 
                    ? ` (${activities.length})` 
                    : ` (${activities.filter(a => a.status === status).length})`}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <FiCalendar className="text-6xl mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No activities found</p>
                <p className="text-sm mt-2">
                  {isOfficer && filterStatus === 'all' && 'Submit your first activity proposal'}
                </p>
              </div>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card key={activity.activity_id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{activity.activity_title}</h3>
                      <Badge variant={getStatusBadge(activity.status)}>
                        {getStatusIcon(activity.status)} {activity.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="primary">{activity.org_acronym}</Badge>
                      <Badge variant="secondary">{activity.activity_type}</Badge>
                    </div>

                    {activity.description && (
                      <p className="text-gray-600 mb-4">{activity.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <FiCalendar className="mr-2 text-green-600" />
                        <div>
                          <div className="font-medium">Start</div>
                          <div>{new Date(activity.start_date).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(activity.start_date).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <FiClock className="mr-2 text-green-600" />
                        <div>
                          <div className="font-medium">End</div>
                          <div>{new Date(activity.end_date).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(activity.end_date).toLocaleTimeString()}</div>
                        </div>
                      </div>

                      {activity.venue && (
                        <div className="flex items-center text-gray-600">
                          <FiMapPin className="mr-2 text-green-600" />
                          <div>
                            <div className="font-medium">Venue</div>
                            <div>{activity.venue}</div>
                          </div>
                        </div>
                      )}

                      {activity.target_participants && (
                        <div className="flex items-center text-gray-600">
                          <FiUsers className="mr-2 text-green-600" />
                          <div>
                            <div className="font-medium">Participants</div>
                            <div>{activity.target_participants}</div>
                          </div>
                        </div>
                      )}

                      {activity.budget && (
                        <div className="flex items-center text-gray-600">
                          <FiDollarSign className="mr-2 text-green-600" />
                          <div>
                            <div className="font-medium">Budget</div>
                            <div>₱{parseFloat(activity.budget).toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {activity.review_remarks && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <FiFileText className="mr-2" />
                          <span className="font-medium">Review Remarks:</span>
                        </div>
                        <p className="text-sm text-gray-700">{activity.review_remarks}</p>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Submitted on {new Date(activity.submitted_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex gap-2">
                    {/* Review Button for CESSCA Staff */}
                    {isCessca && activity.status === 'pending' && (
                      <button
                        onClick={() => openReviewModal(activity)}
                        className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition"
                      >
                        Review
                      </button>
                    )}

                    {/* Delete Button */}
                    {((isOfficer && activity.submitted_by === user.userId && activity.status === 'pending') || isCessca) && (
                      <button
                        onClick={() => handleDeleteActivity(activity.activity_id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        title="Delete Activity"
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        </>
        )}
      </div>

      {/* Create Activity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit Activity Proposal</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <form onSubmit={handleSubmitActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization *
                  </label>
                  <select
                    name="orgId"
                    value={formData.orgId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="">Select organization...</option>
                    {organizations
                      .filter(org => org.status === 'active')
                      .map(org => (
                        <option key={org.org_id} value={org.org_id}>
                          {org.org_name} ({org.org_acronym})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Title *
                  </label>
                  <input
                    type="text"
                    name="activityTitle"
                    value={formData.activityTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Type *
                    </label>
                    <select
                      name="activityType"
                      value={formData.activityType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                      required
                    >
                      <option value="seminar">Seminar</option>
                      <option value="workshop">Workshop</option>
                      <option value="competition">Competition</option>
                      <option value="social">Social</option>
                      <option value="fundraising">Fundraising</option>
                      <option value="community_service">Community Service</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Participants
                    </label>
                    <input
                      type="number"
                      name="targetParticipants"
                      value={formData.targetParticipants}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget (₱)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Submit Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Review Activity Modal */}
      {showReviewModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Activity</h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedActivity(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedActivity.activity_title}</h3>
                <p className="text-sm text-gray-600">{selectedActivity.org_name}</p>
                <p className="text-sm text-gray-600 mt-2">{selectedActivity.description}</p>
              </div>

              <form onSubmit={handleReviewActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Decision *
                  </label>
                  <select
                    value={reviewData.status}
                    onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={reviewData.remarks}
                    onChange={(e) => setReviewData(prev => ({ ...prev, remarks: e.target.value }))}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    placeholder="Add any remarks or feedback..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedActivity(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg ${
                      reviewData.status === 'approved'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {reviewData.status === 'approved' ? 'Approve Activity' : 'Reject Activity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Activities;
