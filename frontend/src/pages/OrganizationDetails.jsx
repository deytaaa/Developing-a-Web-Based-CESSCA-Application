import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { organizationService } from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import { FiUsers, FiCalendar, FiMapPin, FiClock, FiAward, FiUserPlus, FiUserMinus, FiArrowLeft, FiTarget, FiHeart, FiPlus, FiX, FiTrash2, FiCheck, FiEdit, FiUpload, FiImage, FiCamera, FiMaximize2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

  // Edit organization state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    org_name: '',
    org_acronym: '',
    org_type: '',
    description: '',
    mission: '',
    vision: '',
    status: '',
    founded_date: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Gallery state
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryFormData, setGalleryFormData] = useState({
    description: '',
    album_name: '',
    activity_id: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  
  // Album viewer state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());

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
      const [orgData, officersData, membersData, activitiesData, galleryData] = await Promise.all([
        organizationService.getById(id),
        organizationService.getOfficers(id),
        organizationService.getMembers(id),
        organizationService.getActivities(id),
        organizationService.getGallery(id)
      ]);
      
      setOrganization(orgData.organization || orgData);
      setOfficers(officersData.officers || officersData);
      setMembers(membersData.members || membersData);
      setActivities(activitiesData.activities || activitiesData);
      setGalleryPhotos(galleryData.photos || []);
      
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

  const handleEditOrganization = () => {
    setEditFormData({
      org_name: organization.org_name || '',
      org_acronym: organization.org_acronym || '',
      org_type: organization.org_type || '',
      description: organization.description || '',
      mission: organization.mission || '',
      vision: organization.vision || '',
      status: organization.status || '',
      founded_date: organization.founded_date ? organization.founded_date.split('T')[0] : ''
    });
    setLogoPreview(organization.logo_url ? `http://localhost:5000${organization.logo_url}` : null);
    setShowEditModal(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the organization logo?')) return;

    try {
      await organizationService.deleteLogo(id);
      setLogoFile(null);
      setLogoPreview(null);
      alert('Logo removed successfully');
      loadOrganizationData();
    } catch (error) {
      console.error('Error removing logo:', error);
      alert('Failed to remove logo');
    }
  };

  const handleSaveOrganization = async () => {
    try {
      // Update organization details
      await organizationService.update(id, editFormData);

      // Upload logo if changed
      if (logoFile) {
        await organizationService.uploadLogo(id, logoFile);
      }

      alert('Organization updated successfully');
      setShowEditModal(false);
      setLogoFile(null);
      loadOrganizationData();
    } catch (error) {
      console.error('Error updating organization:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update organization';
      alert(errorMessage);
    }
  };

  // Gallery handlers
  const handleGalleryImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate all files
    const validFiles = [];
    const previews = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 5MB`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`);
        continue;
      }
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    // Append new files to existing ones instead of replacing
    setImageFiles([...imageFiles, ...validFiles]);
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleUploadGalleryPhoto = async (e) => {
    e.preventDefault();
    
    if (imageFiles.length === 0) {
      alert('Please select at least one image to upload');
      return;
    }

    if (!galleryFormData.album_name) {
      alert('Please provide an album name');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress({ current: 0, total: imageFiles.length });

      // Get existing photo count for this album to determine starting order
      let startingOrder = 1;
      if (galleryFormData.album_name) {
        const existingPhotos = galleryPhotos.filter(
          p => p.album_name === galleryFormData.album_name
        );
        startingOrder = existingPhotos.length + 1;
      }

      // Upload each image with the same metadata
      for (let i = 0; i < imageFiles.length; i++) {
        const photoData = {
          image: imageFiles[i],
          title: imageFiles.length > 1 ? `${galleryFormData.album_name} - Photo ${startingOrder + i}` : galleryFormData.album_name,
          description: galleryFormData.description,
          album_name: galleryFormData.album_name,
          activity_id: galleryFormData.activity_id,
          photo_order: startingOrder + i
        };

        await organizationService.uploadGalleryPhoto(id, photoData);
        setUploadProgress({ current: i + 1, total: imageFiles.length });
      }

      alert(`${imageFiles.length} photo(s) uploaded successfully!`);
      setShowGalleryModal(false);
      setGalleryFormData({ description: '', album_name: '', activity_id: '' });
      setImageFiles([]);
      setImagePreviews([]);
      setUploadProgress({ current: 0, total: 0 });
      loadOrganizationData();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGalleryPhoto = async (galleryId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await organizationService.deleteGalleryPhoto(id, galleryId);
      alert('Photo deleted successfully');
      
      // If viewing in modal, update album photos
      if (showImageModal && albumPhotos.length > 1) {
        const updatedPhotos = albumPhotos.filter(p => p.gallery_id !== galleryId);
        setAlbumPhotos(updatedPhotos);
        if (currentPhotoIndex >= updatedPhotos.length) {
          setCurrentPhotoIndex(updatedPhotos.length - 1);
        }
      } else if (showImageModal) {
        setShowImageModal(false);
        setAlbumPhotos([]);
      }
      
      loadOrganizationData();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  // Album viewer handlers
  const openPhotoViewer = (photo, allPhotos) => {
    const index = allPhotos.findIndex(p => p.gallery_id === photo.gallery_id);
    setAlbumPhotos(allPhotos);
    setCurrentPhotoIndex(index >= 0 ? index : 0);
    setSelectedAlbum(photo);
    setShowImageModal(true);
  };

  const navigatePhoto = (direction) => {
    if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (direction === 'next' && currentPhotoIndex < albumPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const getCurrentPhoto = () => albumPhotos[currentPhotoIndex] || null;

  // Group photos by album
  const groupPhotosByAlbum = (photos) => {
    const albums = {};
    const standalone = [];

    photos.forEach(photo => {
      if (photo.album_name) {
        if (!albums[photo.album_name]) {
          albums[photo.album_name] = [];
        }
        albums[photo.album_name].push(photo);
      } else {
        standalone.push(photo);
      }
    });

    // Sort photos within each album by photo_order
    Object.keys(albums).forEach(albumName => {
      albums[albumName].sort((a, b) => (a.photo_order || 0) - (b.photo_order || 0));
    });

    return { albums, standalone };
  };

  const openAlbumViewer = (albumPhotos, albumName) => {
    setAlbumPhotos(albumPhotos);
    setCurrentPhotoIndex(0);
    setSelectedAlbum({ album_name: albumName });
    setShowImageModal(true);
  };

  const toggleDescription = (albumName) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(albumName)) {
        newSet.delete(albumName);
      } else {
        newSet.add(albumName);
      }
      return newSet;
    });
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
              <div className="w-24 h-24 bg-green-100 rounded-lg flex items-center justify-center overflow-hidden">
                {organization.logo_url ? (
                  <img 
                    src={`http://localhost:5000${organization.logo_url}`} 
                    alt={organization.org_name} 
                    className="w-full h-full object-cover rounded-lg" 
                  />
                ) : (
                  <FiUsers className="text-4xl text-green-600" />
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
            
            <div className="flex items-center space-x-3">
              {canManageOfficers && (
                <button
                  onClick={handleEditOrganization}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiEdit className="mr-2" />
                  Edit Organization
                </button>
              )}
              
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
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {['info', 'officers', 'members', 'activities', 'gallery'].map((tab) => (
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

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            {/* Gallery Header */}
            {(isOfficer || user?.role === 'cessca_staff' || user?.role === 'admin') && (
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Photo Gallery</h3>
                    <p className="text-sm text-gray-600">Document your organization's events and activities</p>
                  </div>
                  <button
                    onClick={() => setShowGalleryModal(true)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <FiCamera className="mr-2" />
                    Upload Photo
                  </button>
                </div>
              </Card>
            )}

            {/* Gallery Grid */}
            {galleryPhotos.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <FiImage className="text-5xl mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No photos uploaded yet</p>
                  {(isOfficer || user?.role === 'cessca_staff' || user?.role === 'admin') && (
                    <p className="text-sm text-gray-500 mt-2">Be the first to upload a photo!</p>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const { albums, standalone } = groupPhotosByAlbum(galleryPhotos);
                  
                  return (
                    <>
                      {/* Albums */}
                      {Object.keys(albums).length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Albums</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Object.entries(albums).map(([albumName, photos]) => {
                              const coverPhoto = photos[0];
                              return (
                                <div 
                                  key={albumName}
                                  className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                                  onClick={() => openAlbumViewer(photos, albumName)}
                                >
                                  <div className="aspect-square overflow-hidden bg-gray-100 relative">
                                    <img
                                      src={`http://localhost:5000${coverPhoto.image_url}`}
                                      alt={albumName}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Photo count badge */}
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                                      <FiImage />
                                      {photos.length}
                                    </div>
                                    {/* Expand icon */}
                                    <div className="absolute top-2 left-2">
                                      <div className="p-2 bg-black bg-opacity-50 text-white rounded-full">
                                        <FiMaximize2 className="text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{albumName}</h4>
                                    {coverPhoto.activity_title && (
                                      <div className="mb-2">
                                        <Badge variant="primary">{coverPhoto.activity_title}</Badge>
                                      </div>
                                    )}
                                    {coverPhoto.description && (
                                      <div className="mb-2">
                                        <p className={`text-sm text-gray-600 ${
                                          expandedDescriptions.has(albumName) ? '' : 'line-clamp-2'
                                        }`}>
                                          {coverPhoto.description}
                                        </p>
                                        {coverPhoto.description.length > 80 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleDescription(albumName);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                                          >
                                            {expandedDescriptions.has(albumName) ? 'Read Less' : 'Read More'}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>By {coverPhoto.first_name} {coverPhoto.last_name}</span>
                                      <span>{new Date(coverPhoto.uploaded_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Standalone Photos */}
                      {standalone.length > 0 && (
                        <div>
                          {Object.keys(albums).length > 0 && (
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Photos</h3>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {standalone.map((photo) => (
                              <Card 
                                key={photo.gallery_id} 
                                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => openPhotoViewer(photo, galleryPhotos)}
                              >
                                <div className="relative">
                                  <img
                                    src={`http://localhost:5000${photo.image_url}`}
                                    alt={photo.title}
                                    className="w-full h-64 object-cover"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openPhotoViewer(photo, galleryPhotos);
                                      }}
                                      className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                                      title="View fullscreen"
                                    >
                                      <FiMaximize2 />
                                    </button>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <h4 className="font-semibold text-gray-900 mb-2">{photo.title}</h4>
                                  {photo.description && (
                                    <div className="mb-3">
                                      <p className={`text-sm text-gray-600 ${
                                        expandedDescriptions.has(`standalone-${photo.gallery_id}`) ? '' : 'line-clamp-2'
                                      }`}>
                                        {photo.description}
                                      </p>
                                      {photo.description.length > 80 && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDescription(`standalone-${photo.gallery_id}`);
                                          }}
                                          className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                                        >
                                          {expandedDescriptions.has(`standalone-${photo.gallery_id}`) ? 'Read Less' : 'Read More'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {photo.activity_title && (
                                    <div className="mb-2">
                                      <Badge variant="primary">{photo.activity_title}</Badge>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>By {photo.first_name} {photo.last_name}</span>
                                    <span>{new Date(photo.uploaded_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Photo Viewer Modal */}
      {showImageModal && albumPhotos.length > 0 && getCurrentPhoto() && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') navigatePhoto('prev');
            if (e.key === 'ArrowRight') navigatePhoto('next');
            if (e.key === 'Escape') setShowImageModal(false);
          }}
          tabIndex={0}
        >
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start px-6 py-4 bg-black bg-opacity-50">
              <div className="text-white flex-1">
                <h3 className="text-xl font-bold mb-1">{getCurrentPhoto().title}</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {getCurrentPhoto().album_name && (
                    <Badge variant="info">{getCurrentPhoto().album_name}</Badge>
                  )}
                  {getCurrentPhoto().activity_title && (
                    <Badge variant="primary">{getCurrentPhoto().activity_title}</Badge>
                  )}
                  {albumPhotos.length > 1 && (
                    <span className="text-sm text-gray-300">
                      {currentPhotoIndex + 1} / {albumPhotos.length}
                    </span>
                  )}
                  <span className="text-sm text-gray-400">
                    • {getCurrentPhoto().first_name} {getCurrentPhoto().last_name}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                {(isOfficer || user?.role === 'cessca_staff' || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDeleteGalleryPhoto(getCurrentPhoto().gallery_id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    title="Delete Photo"
                  >
                    <FiTrash2 />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedAlbum(null);
                    setAlbumPhotos([]);
                    setCurrentPhotoIndex(0);
                  }}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  title="Close (Esc)"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div className="flex items-center justify-center flex-1 relative px-4 py-6">
              {/* Previous Button */}
              {albumPhotos.length > 1 && currentPhotoIndex > 0 && (
                <button
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-6 z-10 p-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-all backdrop-blur-sm"
                  title="Previous Photo (←)"
                >
                  <FiChevronLeft className="text-2xl" />
                </button>
              )}

              {/* Image */}
              <img
                src={`http://localhost:5000${getCurrentPhoto().image_url}`}
                alt={getCurrentPhoto().title}
                className="max-h-full max-w-full object-contain"
                style={{ maxHeight: 'calc(100vh - 220px)' }}
              />

              {/* Next Button */}
              {albumPhotos.length > 1 && currentPhotoIndex < albumPhotos.length - 1 && (
                <button
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-6 z-10 p-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-all backdrop-blur-sm"
                  title="Next Photo (→)"
                >
                  <FiChevronRight className="text-2xl" />
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            {albumPhotos.length > 1 && (
              <div className="bg-black bg-opacity-60 px-6 py-4">
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                  {albumPhotos.map((photo, index) => (
                    <button
                      key={photo.gallery_id}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`flex-shrink-0 relative transition-all ${
                        index === currentPhotoIndex
                          ? 'ring-4 ring-blue-500 scale-110'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      title={photo.title}
                    >
                      <img
                        src={`http://localhost:5000${photo.image_url}`}
                        alt={photo.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      {index === currentPhotoIndex && (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Gallery Photo Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Upload Photo</h3>
              <button
                onClick={() => {
                  setShowGalleryModal(false);
                  setGalleryFormData({ title: '', description: '', album_name: '', activity_id: '' });
                  setImageFiles([]);
                  setImagePreviews([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleUploadGalleryPhoto} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Select multiple images)</span>
                </label>
                
                {/* Upload Area */}
                {imagePreviews.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FiUpload className="mx-auto text-4xl text-gray-400 mb-2" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImageChange}
                      className="hidden"
                      id="gallery-images"
                      required
                    />
                    <label
                      htmlFor="gallery-images"
                      className="cursor-pointer text-green-600 hover:text-green-700 font-medium"
                    >
                      Click to upload images
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB each. Select multiple files.</p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <FiX />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center rounded-b-lg">
                            Photo {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImageChange}
                      className="hidden"
                      id="gallery-images-more"
                    />
                    <label
                      htmlFor="gallery-images-more"
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <FiUpload className="mr-2" />
                      Add More Images
                    </label>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress.current} / {uploadProgress.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={galleryFormData.description}
                  onChange={(e) => setGalleryFormData({ ...galleryFormData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Photo description (optional)"
                />
              </div>

              {/* Album Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album Name <span className="text-red-500">*</span>
                  {imageFiles.length > 1 && (
                    <span className="text-xs text-gray-500 ml-2">(Photos will be numbered)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={galleryFormData.album_name}
                  onChange={(e) => setGalleryFormData({ ...galleryFormData, album_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., LAONG LAAN, Leadership Summit 2026, Charity Run"
                  required
                />
              </div>

              {/* Link to Activity */}
              {activities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Activity (Optional)
                  </label>
                  <select
                    value={galleryFormData.activity_id}
                    onChange={(e) => setGalleryFormData({ ...galleryFormData, activity_id: e.target.value })}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Not linked to any activity</option>
                    {activities.map((activity) => (
                      <option key={activity.activity_id} value={activity.activity_id}>
                        {activity.activity_title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGalleryModal(false);
                    setGalleryFormData({ title: '', description: '', album_name: '', activity_id: '' });
                    setImageFiles([]);
                    setImagePreviews([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : `Upload ${imageFiles.length > 0 ? `${imageFiles.length} Photo${imageFiles.length > 1 ? 's' : ''}` : 'Photos'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
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

      {/* Edit Organization Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setLogoFile(null);
          setLogoPreview(null);
        }}
        title="Edit Organization"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowEditModal(false);
              setLogoFile(null);
              setLogoPreview(null);
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveOrganization} className="ml-2">
              Save Changes
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Logo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <FiImage className="text-4xl text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <FiUpload className="mr-2" />
                  Upload Logo
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="ml-2 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <FiTrash2 className="mr-2" />
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Recommended: Square image, max 5MB</p>
          </div>

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={editFormData.org_name}
              onChange={(e) => setEditFormData({ ...editFormData, org_name: e.target.value })}
            />
          </div>

          {/* Acronym */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acronym <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={editFormData.org_acronym}
              onChange={(e) => setEditFormData({ ...editFormData, org_acronym: e.target.value })}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={editFormData.org_type}
              onChange={(e) => setEditFormData({ ...editFormData, org_type: e.target.value })}
            >
              <option value="">Select type...</option>
              <option value="academic">Academic</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="social">Social</option>
              <option value="special_interest">Special Interest</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={editFormData.status}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Founded Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Founded Date
            </label>
            <input
              type="date"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={editFormData.founded_date}
              onChange={(e) => setEditFormData({ ...editFormData, founded_date: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows="3"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
          </div>

          {/* Mission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission
            </label>
            <textarea
              rows="3"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={editFormData.mission}
              onChange={(e) => setEditFormData({ ...editFormData, mission: e.target.value })}
            />
          </div>

          {/* Vision */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vision
            </label>
            <textarea
              rows="3"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={editFormData.vision}
              onChange={(e) => setEditFormData({ ...editFormData, vision: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default OrganizationDetails;
