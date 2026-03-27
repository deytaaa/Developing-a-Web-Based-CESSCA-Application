import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import api from '../services/api';
import { FiCamera, FiTrash2, FiUser } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    address: '',
  });

  // Alumni-specific state
  const [alumniData, setAlumniData] = useState({
    graduationYear: '',
    degreeProgram: '',
    currentEmploymentStatus: '',
    companyName: '',
    jobPosition: '',
    industry: '',
    employmentStartDate: '',
    currentAddress: '',
    permanentAddress: '',
    contactEmail: '',
    contactNumber: '',
    linkedinProfile: '',
  });
  
  const isAlumni = user?.role === 'alumni';

  useEffect(() => {
    if (user?.profile) {
      // Only update if we have actual profile data
      setFormData(prev => ({
        firstName: user.profile.first_name ?? prev.firstName,
        middleName: user.profile.middle_name ?? prev.middleName,
        lastName: user.profile.last_name ?? prev.lastName,
        contactNumber: user.profile.contact_number ?? prev.contactNumber,
        address: user.profile.address ?? prev.address,
      }));
    }
    
    // Fetch alumni profile if user is alumni
    if (isAlumni) {
      fetchAlumniProfile();
    }
  }, [user, isAlumni]);
  
  const fetchAlumniProfile = async () => {
    try {
      const response = await api.get('/alumni/profile');
      if (response.data.success && response.data.alumni) {
        const alum = response.data.alumni;
        setAlumniData({
          graduationYear: alum.graduation_year || '',
          degreeProgram: alum.degree_program || '',
          currentEmploymentStatus: alum.current_employment_status || '',
          companyName: alum.company_name || '',
          jobPosition: alum.job_position || '',
          industry: alum.industry || '',
          employmentStartDate: alum.employment_start_date || '',
          currentAddress: alum.current_address || '',
          permanentAddress: alum.permanent_address || '',
          contactEmail: alum.contact_email || '',
          contactNumber: alum.contact_number || '',
          linkedinProfile: alum.linkedin_profile || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch alumni profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Save basic profile
      await authService.updateProfile(formData);

      // Save alumni profile if user is alumni
      if (isAlumni) {
        // Format employmentStartDate as 'YYYY-MM-DD' if present
        let alumniPayload = { ...alumniData };
        if (alumniPayload.employmentStartDate) {
          const date = new Date(alumniPayload.employmentStartDate);
          if (!isNaN(date.getTime())) {
            alumniPayload.employmentStartDate = date.toISOString().split('T')[0];
          }
        }
        await api.post('/alumni/profile', alumniPayload);
      }

      const updated = await authService.getProfile();
      updateUser(updated.user);
      setEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post('/auth/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const updated = await authService.getProfile();
        updateUser(updated.user);
        alert('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload profile picture: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      const response = await api.delete('/auth/profile/picture');
      if (response.data.success) {
        const updated = await authService.getProfile();
        updateUser(updated.user);
        alert('Profile picture deleted successfully');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete profile picture: ' + (error.response?.data?.message || error.message));
    }
  };

  const getProfilePictureUrl = () => {
    if (user?.profile?.profile_picture) {
      // Add timestamp to force refresh after upload
      const timestamp = new Date().getTime();
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      return `${backendUrl}${user.profile.profile_picture}?t=${timestamp}`;
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {!editing && (
            <Button variant="primary" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Picture Section */}
        <Card>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {getProfilePictureUrl() ? (
                <img
                  src={getProfilePictureUrl()}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-green-600"
                  onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-green-600">
                  <FiUser className="w-16 h-16 text-gray-400" />
                </div>
              )}
              {uploadingPicture && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="text-white text-sm">Uploading...</div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
              >
                <FiCamera className="inline mr-2" />
                {getProfilePictureUrl() ? 'Change Picture' : 'Upload Picture'}
              </Button>
              {getProfilePictureUrl() && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDeleteProfilePicture}
                  disabled={uploadingPicture}
                >
                  <FiTrash2 className="inline mr-2" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-600">Recommended: Square image, max 5MB (JPG, PNG, GIF)</p>
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  disabled={!editing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                <input
                  type="text"
                  disabled={!editing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  disabled={!editing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                <input
                  type="tel"
                  disabled={!editing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  disabled={!editing}
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {editing && !isAlumni && (
              <div className="flex space-x-2">
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    // Reset form
                    if (user?.profile) {
                      setFormData({
                        firstName: user.profile.first_name || '',
                        middleName: user.profile.middle_name || '',
                        lastName: user.profile.last_name || '',
                        contactNumber: user.profile.contact_number || '',
                        address: user.profile.address || '',
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </Card>

        {isAlumni && (
          <Card title="Alumni Information">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={!editing}
                    required
                    min="1990"
                    max="2030"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.graduationYear}
                    onChange={(e) => setAlumniData({ ...alumniData, graduationYear: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={!editing}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.degreeProgram}
                    onChange={(e) => setAlumniData({ ...alumniData, degreeProgram: e.target.value })}
                  >
                    <option value="">Select a degree program</option>
                    <option value="Bachelor of Science in Information Technology (BSIT)">Bachelor of Science in Information Technology (BSIT)</option>
                    <option value="Bachelor of Science in Office Administration (BSOA)">Bachelor of Science in Office Administration (BSOA)</option>
                    <option value="Bachelor of Science in Accounting Information System (BSAIS)">Bachelor of Science in Accounting Information System (BSAIS)</option>
                    <option value="Certificate in Computer Sciences (CCS)">Certificate in Computer Sciences (CCS)</option>
                    <option value="Certificate in Office Administration (COA)">Certificate in Office Administration (COA)</option>
                    <option value="Certificate in Hotel and Restaurant Management (CHRM)">Certificate in Hotel and Restaurant Management (CHRM)</option>
                    <option value="Associate in Hotel and Restaurant Technology (AHRT)">Associate in Hotel and Restaurant Technology (AHRT)</option>
                    <option value="Associate in Human Resource Development (AHRD)">Associate in Human Resource Development (AHRD)</option>
                    <option value="Associate in Accounting Information System (AAIS)">Associate in Accounting Information System (AAIS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={!editing}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.currentEmploymentStatus}
                    onChange={(e) => setAlumniData({ ...alumniData, currentEmploymentStatus: e.target.value })}
                  >
                    <option value="">Select Status</option>
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="studying">Studying</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    disabled={!editing}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.companyName}
                    onChange={(e) => setAlumniData({ ...alumniData, companyName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Position</label>
                  <input
                    type="text"
                    disabled={!editing}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.jobPosition}
                    onChange={(e) => setAlumniData({ ...alumniData, jobPosition: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    disabled={!editing}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.industry}
                    onChange={(e) => setAlumniData({ ...alumniData, industry: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Start Date</label>
                  <input
                    type="date"
                    disabled={!editing}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.employmentStartDate}
                    onChange={(e) => setAlumniData({ ...alumniData, employmentStartDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    disabled={!editing}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.contactEmail}
                    onChange={(e) => setAlumniData({ ...alumniData, contactEmail: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    disabled={!editing}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.contactNumber}
                    onChange={(e) => setAlumniData({ ...alumniData, contactNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                  <input
                    type="url"
                    disabled={!editing}
                    placeholder="https://linkedin.com/in/..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.linkedinProfile}
                    onChange={(e) => setAlumniData({ ...alumniData, linkedinProfile: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Address</label>
                  <textarea
                    disabled={!editing}
                    rows="2"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.currentAddress}
                    onChange={(e) => setAlumniData({ ...alumniData, currentAddress: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permanent Address</label>
                  <textarea
                    disabled={!editing}
                    rows="2"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-700"
                    value={alumniData.permanentAddress}
                    onChange={(e) => setAlumniData({ ...alumniData, permanentAddress: e.target.value })}
                  />
                </div>
              </div>

              {editing && (
                <div className="flex space-x-2">
                  <Button type="submit" variant="primary">
                    Save All Changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditing(false);
                      fetchAlumniProfile();
                      if (user?.profile) {
                        setFormData({
                          firstName: user.profile.first_name || '',
                          middleName: user.profile.middle_name || '',
                          lastName: user.profile.last_name || '',
                          contactNumber: user.profile.contact_number || '',
                          address: user.profile.address || '',
                        });
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </Card>
        )}

        <Card title="Account Information">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-base font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-base font-medium text-gray-900 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-base font-medium text-gray-900 capitalize">{user?.status ? user.status : 'N/A'}</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
