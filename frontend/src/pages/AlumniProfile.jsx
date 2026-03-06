import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Badge from '../components/Badge';
import { alumniService } from '../services/alumniService';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiAward, FiCalendar, FiMapPin, FiArrowLeft, FiPlus, FiX, FiEdit, FiSave } from 'react-icons/fi';

const AlumniProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [alumni, setAlumni] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    achievementDate: '',
    achievementType: '',
    institution: ''
  });
  const [profileForm, setProfileForm] = useState({
    graduationYear: '',
    degreeProgram: '',
    currentEmploymentStatus: '',
    companyName: '',
    jobPosition: '',
    industry: '',
    employmentStartDate: '',
    contactEmail: '',
    contactNumber: '',
    linkedinProfile: '',
    currentAddress: '',
    permanentAddress: ''
  });

  useEffect(() => {
    loadAlumniProfile();
    loadAchievements();
  }, [id]);

  const loadAlumniProfile = async () => {
    try {
      setLoading(true);
      const data = await alumniService.getById(id);
      setAlumni(data);
      // Populate form with current data
      setProfileForm({
        graduationYear: data.graduation_year || '',
        degreeProgram: data.degree_program || '',
        currentEmploymentStatus: data.current_employment_status || '',
        companyName: data.company_name || '',
        jobPosition: data.job_position || '',
        industry: data.industry || '',
        employmentStartDate: data.employment_start_date || '',
        contactEmail: data.contact_email || '',
        contactNumber: data.contact_number || '',
        linkedinProfile: data.linkedin_profile || '',
        currentAddress: data.current_address || '',
        permanentAddress: data.permanent_address || ''
      });
    } catch (error) {
      console.error('Error loading alumni profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const data = await alumniService.getAchievements(id);
      setAchievements(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    try {
      await alumniService.addAchievement(id, achievementForm);
      setShowAchievementModal(false);
      setAchievementForm({ title: '', description: '', achievementDate: '', achievementType: '', institution: '' });
      loadAchievements();
    } catch (error) {
      console.error('Error adding achievement:', error);
      alert('Failed to add achievement');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await alumniService.saveProfile(profileForm);
      setEditing(false);
      loadAlumniProfile();
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const isOwnProfile = currentUser && alumni && (
    currentUser.userId === alumni.user_id || 
    currentUser.role === 'admin' || 
    currentUser.role === 'cessca_staff'
  );

  const getEmploymentBadgeVariant = (status) => {
    switch (status) {
      case 'employed': return 'success';
      case 'self-employed': return 'info';
      case 'unemployed': return 'warning';
      case 'studying': return 'primary';
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

  if (!alumni) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <FiUser className="text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600">Alumni not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/alumni')}
          className="flex items-center text-green-600 hover:text-green-800 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Back to Alumni List
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Alumni Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center">
              {alumni.profile_picture ? (
                <img 
                  src={`http://localhost:5000${alumni.profile_picture}`} 
                  alt={`${alumni.first_name} ${alumni.last_name}`}
                  className="w-32 h-32 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                  {alumni.first_name?.[0]}{alumni.last_name?.[0]}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                {alumni.first_name} {alumni.middle_name} {alumni.last_name}
              </h2>
              <p className="text-gray-600 text-center mt-2">{alumni.degree_program}</p>
              <Badge variant={getEmploymentBadgeVariant(alumni.current_employment_status)} className="mt-3">
                {alumni.current_employment_status}
              </Badge>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center text-gray-700">
                <FiMail className="mr-3 text-gold-600" />
                <span className="text-sm">{alumni.email}</span>
              </div>
              {alumni.contact_number && (
                <div className="flex items-center text-gray-700">
                  <FiPhone className="mr-3 text-gold-600" />
                  <span className="text-sm">{alumni.contact_number}</span>
                </div>
              )}
              {alumni.address && (
                <div className="flex items-center text-gray-700">
                  <FiMapPin className="mr-3 text-gold-600" />
                  <span className="text-sm">{alumni.address}</span>
                </div>
              )}
              <div className="flex items-center text-gray-700">
                <FiCalendar className="mr-3 text-gold-600" />
                <span className="text-sm">Graduated {alumni.graduation_year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employment Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiBriefcase className="text-2xl text-green-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Employment Information</h3>
              </div>
              {isOwnProfile && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FiEdit className="mr-2" />
                  Edit Profile
                </button>
              )}
              {editing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <FiSave className="mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadAlumniProfile();
                    }}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year *</label>
                    <input
                      type="number"
                      required
                      min="1990"
                      max="2030"
                      value={profileForm.graduationYear}
                      onChange={(e) => setProfileForm({ ...profileForm, graduationYear: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree Program *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.degreeProgram}
                      onChange={(e) => setProfileForm({ ...profileForm, degreeProgram: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status *</label>
                    <select
                      required
                      value={profileForm.currentEmploymentStatus}
                      onChange={(e) => setProfileForm({ ...profileForm, currentEmploymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    >
                      <option value="">Select Status</option>
                      <option value="employed">Employed</option>
                      <option value="self-employed">Self-Employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="studying">Pursuing Further Studies</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={profileForm.companyName}
                      onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Position</label>
                    <input
                      type="text"
                      value={profileForm.jobPosition}
                      onChange={(e) => setProfileForm({ ...profileForm, jobPosition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={profileForm.industry}
                      onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Start Date</label>
                    <input
                      type="date"
                      value={profileForm.employmentStartDate}
                      onChange={(e) => setProfileForm({ ...profileForm, employmentStartDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={profileForm.contactEmail}
                      onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={profileForm.contactNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={profileForm.linkedinProfile}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedinProfile: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
                    <textarea
                      value={profileForm.currentAddress}
                      onChange={(e) => setProfileForm({ ...profileForm, currentAddress: e.target.value })}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                    <textarea
                      value={profileForm.permanentAddress}
                      onChange={(e) => setProfileForm({ ...profileForm, permanentAddress: e.target.value })}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Current Company</label>
                  <p className="text-gray-900">{alumni.company_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Position</label>
                  <p className="text-gray-900">{alumni.job_position || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Industry</label>
                  <p className="text-gray-900">{alumni.industry || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Employment Start Date</label>
                  <p className="text-gray-900">
                    {alumni.employment_start_date ? new Date(alumni.employment_start_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {alumni.linkedin_profile && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">LinkedIn Profile</label>
                    <p className="text-gray-900">
                      <a href={alumni.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                        {alumni.linkedin_profile}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiAward className="text-2xl text-gold-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Achievements</h3>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setShowAchievementModal(true)}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FiPlus className="mr-2" />
                  Add Achievement
                </button>
              )}
            </div>
            
            {achievements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiAward className="text-5xl mx-auto mb-3 text-gray-400" />
                <p>No achievements recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.achievement_id} className="border-l-4 border-green-600 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{achievement.description}</p>
                    {achievement.institution && (
                      <p className="text-gray-500 text-sm mt-1">Institution: {achievement.institution}</p>
                    )}
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Badge variant="secondary" className="mr-2">{achievement.achievement_type}</Badge>
                      <FiCalendar className="mr-1" />
                      {new Date(achievement.achievement_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Education History</h3>
            <div className="border-l-4 border-gold-600 pl-4 py-2">
              <h4 className="font-semibold text-gray-900">{alumni.degree_program}</h4>
              <p className="text-gray-600 text-sm">Pateros Technological College</p>
              <p className="text-gray-500 text-sm mt-1">Graduated: {alumni.graduation_year}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Achievement Modal */}
      {showAchievementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Achievement</h3>
              <button
                onClick={() => setShowAchievementModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            
            <form onSubmit={handleAddAchievement}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={achievementForm.title}
                    onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={achievementForm.description}
                    onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    value={achievementForm.achievementType}
                    onChange={(e) => setAchievementForm({ ...achievementForm, achievementType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  >
                    <option value="">Select Type</option>
                    <option value="academic">Academic</option>
                    <option value="professional">Professional</option>
                    <option value="award">Award</option>
                    <option value="publication">Publication</option>
                    <option value="certification">Certification</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={achievementForm.institution}
                    onChange={(e) => setAchievementForm({ ...achievementForm, institution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Achieved *
                  </label>
                  <input
                    type="date"
                    required
                    value={achievementForm.achievementDate}
                    onChange={(e) => setAchievementForm({ ...achievementForm, achievementDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAchievementModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Achievement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AlumniProfile;
