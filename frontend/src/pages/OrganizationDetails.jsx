import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { organizationService } from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import { FiUsers, FiCalendar, FiMapPin, FiClock, FiAward, FiUserPlus, FiUserMinus, FiArrowLeft, FiTarget, FiHeart, FiPlus, FiX, FiTrash2, FiCheck } from 'react-icons/fi';

const OrganizationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [error, setError] = useState(null);
  
  // Officer management state
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [potentialOfficers, setPotentialOfficers] = useState([]);
  const [officerFormData, setOfficerFormData] = useState({
    userId: '',
    position: '',
    termStart: new Date().toISOString().split('T')[0],
    termEnd: ''
  });

  const canManageOfficers = user && (user.role === 'cessca_staff' || user.role === 'admin');
  const canManageMembers = user && (user.role === 'cessca_staff' || user.role === 'admin' || isOfficer);

  useEffect(() => {
    if (id) {
      loadOrganizationData();
    }
  }, [id]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orgData, officersData, membersData, activitiesData] = await Promise.all([
        organizationService.getById(id),
        organizationService.getOfficers(id),
        organizationService.getMembers(id),
        organizationService.getActivities(id)
      ]);
      
      setOrganization(orgData.organization || orgData);
      setOfficers(officersData.officers || officersData);
      setMembers(membersData.members || membersData);
      setActivities(activitiesData.activities || activitiesData);
      
      // Check if current user is a member
      const membersList = membersData.members || membersData;
      const userMember = membersList.find(m => m.user_id === user?.userId);
      setIsMember(userMember && userMember.membership_status === 'active');

      // Check if current user is an officer
      const officersList = officersData.officers || officersData;
      const userOfficer = officersList.find(o => o.user_id === user?.userId && o.status === 'active');
      setIsOfficer(!!userOfficer);
    } catch (error) {
      console.error('Error loading organization:', error);
      setError(error.message || 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await organizationService.join(id);
      alert('Join request submitted! Waiting for approval.');
      loadOrganizationData();
    } catch (error) {
      console.error('Error joining organization:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join organization';
      alert(errorMessage);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this organization?')) return;
    
    try {
      await organizationService.leave(id);
      alert('You have left the organization');
      loadOrganizationData();
    } catch (error) {
      console.error('Error leaving organization:', error);
      alert('Failed to leave organization');
    }
  };

  const openOfficerModal = async () => {
    try {
      const data = await organizationService.getPotentialOfficers(id);
      setPotentialOfficers(data.users || []);
      setShowOfficerModal(true);
    } catch (error) {
      console.error('Error loading potential officers:', error);
      alert('Failed to load potential officers');
    }
  };

  const handleAddOfficer = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!officerFormData.userId || !officerFormData.position || !officerFormData.termStart) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await organizationService.addOfficer(id, officerFormData);
      alert('Officer added successfully!');
      setShowOfficerModal(false);
      setOfficerFormData({ userId: '', position: '', termStart: '', termEnd: '' });
      loadOrganizationData();
    } catch (error) {
      console.error('Error adding officer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add officer';
      alert(errorMessage);
    }
  };

  const handleRemoveOfficer = async (officerId) => {
    if (!confirm('Are you sure you want to remove this officer?')) return;

    try {
      await organizationService.removeOfficer(id, officerId);
      alert('Officer removed successfully');
      loadOrganizationData();
    } catch (error) {
      console.error('Error removing officer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove officer';
      alert(errorMessage);
    }
  };

  const handleApproveMember = async (memberId) => {
    try {
      await organizationService.approveMember(id, memberId);
      alert('Member approved successfully');
      loadOrganizationData();
    } catch (error) {
      console.error('Error approving member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to approve member';
      alert(errorMessage);
    }
  };

  const handleRejectMember = async (memberId) => {
    if (!confirm('Are you sure you want to reject this membership request?')) return;

    try {
      await organizationService.rejectMember(id, memberId);
      alert('Membership request rejected');
      loadOrganizationData();
    } catch (error) {
      console.error('Error rejecting member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject member';
      alert(errorMessage);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member from the organization?')) return;

    try {
      await organizationService.removeMember(id, memberId);
      alert('Member removed successfully');
      loadOrganizationData();
    } catch (error) {
      console.error('Error removing member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove member';
      alert(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'secondary';
      case 'suspended': return 'danger';
      default: return 'secondary';
    }
  };

  const getActivityStatusBadge = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'completed': return 'info';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <FiUsers className="text-6xl text-red-400 mb-4" />
          <p className="text-red-600 mb-2">Error loading organization</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => navigate('/organizations')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Organizations
          </button>
        </div>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <FiUsers className="text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600">Organization not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/organizations')}
            className="flex items-center text-green-600 hover:text-green-800 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Organizations
          </button>
        </div>

        {/* Organization Header */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                {organization.logo_url ? (
                  <img src={organization.logo_url} alt={organization.org_name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <FiUsers className="text-3xl text-green-600" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.org_name}</h1>
                <p className="text-lg text-gray-600">{organization.org_acronym}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge variant="primary">{organization.org_type?.replace('_', ' ')}</Badge>
                  <Badge variant={getStatusBadge(organization.status)}>{organization.status}</Badge>
                </div>
              </div>
            </div>
            
            {user && organization.status === 'active' && (user.role === 'student' || user.role === 'officer') && (
              <div>
                {isMember ? (
                  <button
                    onClick={handleLeave}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <FiUserMinus className="mr-2" />
                    Leave Organization
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <FiUserPlus className="mr-2" />
                    Join Organization
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {['info', 'officers', 'members', 'activities'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{organization.description || 'No description available'}</p>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiTarget className="mr-2 text-green-600" />
                Mission
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{organization.mission || 'No mission statement available'}</p>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiHeart className="mr-2 text-green-600" />
                Vision
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{organization.vision || 'No vision statement available'}</p>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Members</span>
                  <span className="text-2xl font-bold text-green-600">{members.filter(m => m.membership_status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Officers</span>
                  <span className="text-2xl font-bold text-green-600">{officers.filter(o => o.status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Activities</span>
                  <span className="text-2xl font-bold text-green-600">{activities.length}</span>
                </div>
                {organization.founded_date && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Founded</span>
                    <span className="text-sm text-gray-900">{new Date(organization.founded_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'officers' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Organization Officers</h3>
              {canManageOfficers && (
                <button
                  onClick={openOfficerModal}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <FiUserPlus className="text-lg" />
                  <span>Add Officer</span>
                </button>
              )}
            </div>
            {officers.filter(o => o.status === 'active').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiAward className="text-5xl mx-auto mb-3 text-gray-400" />
                <p>No officers assigned yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {officers.filter(o => o.status === 'active').map((officer) => (
                  <div key={officer.officer_id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                    {officer.profile_picture ? (
                      <img 
                        src={`http://localhost:5000${officer.profile_picture}`}
                        alt={`${officer.first_name} ${officer.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-lg">
                          {officer.first_name?.[0]}{officer.last_name?.[0]}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {officer.first_name} {officer.last_name}
                      </h4>
                      <p className="text-sm text-green-600 font-medium">{officer.position}</p>
                      <p className="text-xs text-gray-500">
                        Term: {new Date(officer.term_start).toLocaleDateString()} - 
                        {officer.term_end ? new Date(officer.term_end).toLocaleDateString() : 'Present'}
                      </p>
                    </div>
                    {canManageOfficers && (
                      <button
                        onClick={() => handleRemoveOfficer(officer.officer_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove Officer"
                      >
                        <FiTrash2 className="text-lg" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'members' && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Members ({members.filter(m => m.membership_status === 'active').length})</h3>
            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiUsers className="text-5xl mx-auto mb-3 text-gray-400" />
                <p>No members yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined Date</th>
                      {canManageMembers && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.member_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {member.profile_picture ? (
                              <img 
                                src={`http://localhost:5000${member.profile_picture}`}
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-8 h-8 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 font-semibold text-sm">
                                  {member.first_name?.[0]}{member.last_name?.[0]}
                                </span>
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {member.first_name} {member.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={member.membership_status === 'active' ? 'success' : 'warning'}>
                            {member.membership_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : 'Pending'}
                        </td>
                        {canManageMembers && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {member.membership_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveMember(member.member_id)}
                                    className="text-green-600 hover:text-green-900 transition"
                                    title="Approve Member"
                                  >
                                    <FiCheck className="text-lg" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectMember(member.member_id)}
                                    className="text-red-600 hover:text-red-900 transition"
                                    title="Reject Member"
                                  >
                                    <FiX className="text-lg" />
                                  </button>
                                </>
                              )}
                              {member.membership_status === 'active' && (
                                <button
                                  onClick={() => handleRemoveMember(member.member_id)}
                                  className="text-red-600 hover:text-red-900 transition"
                                  title="Remove Member"
                                >
                                  <FiTrash2 className="text-lg" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-4">
            {/* Add Activity Button for Officers/CESSCA/Admin */}
            {user && (user.role === 'officer' || user.role === 'cessca_staff' || user.role === 'admin') && (
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Organization Activities</h3>
                    <p className="text-sm text-gray-600">Submit and manage activity proposals</p>
                  </div>
                  <button
                    onClick={() => navigate('/activities')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <FiPlus className="mr-2" />
                    Submit Activity
                  </button>
                </div>
              </Card>
            )}
            
            {activities.length === 0 ? (
              <Card>
                <div className="text-center py-8 text-gray-500">
                  <FiCalendar className="text-5xl mx-auto mb-3 text-gray-400" />
                  <p>No activities scheduled</p>
                </div>
              </Card>
            ) : (
              activities.map((activity) => (
                <Card key={activity.activity_id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{activity.activity_title}</h4>
                        <Badge variant={getActivityStatusBadge(activity.status)}>{activity.status}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{activity.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiCalendar className="mr-2 text-green-600" />
                          {new Date(activity.start_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FiClock className="mr-2 text-green-600" />
                          {new Date(activity.start_date).toLocaleTimeString()}
                        </div>
                        {activity.venue && (
                          <div className="flex items-center text-gray-600">
                            <FiMapPin className="mr-2 text-green-600" />
                            {activity.venue}
                          </div>
                        )}
                        {activity.target_participants && (
                          <div className="flex items-center text-gray-600">
                            <FiUsers className="mr-2 text-green-600" />
                            {activity.target_participants} participants
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Officer Modal */}
      {showOfficerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add Officer</h3>
              <button
                onClick={() => {
                  setShowOfficerModal(false);
                  setOfficerFormData({ userId: '', position: '', termStart: '', termEnd: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleAddOfficer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User <span className="text-red-500">*</span>
                </label>
                <select
                  value={officerFormData.userId}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a user...</option>
                  {potentialOfficers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={officerFormData.position}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., President, Vice President"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={officerFormData.termStart}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, termStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term End <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={officerFormData.termEnd}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, termEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Add Officer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOfficerModal(false);
                    setOfficerFormData({ userId: '', position: '', termStart: '', termEnd: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrganizationDetails;
