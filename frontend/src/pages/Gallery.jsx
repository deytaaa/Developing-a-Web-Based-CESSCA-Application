import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { sportsService } from '../services/sportsService';
import { useAuth } from '../contexts/AuthContext';
import heroBg from '../assets/images/artsbanner.png';
import { FiImage, FiUpload, FiX, FiStar, FiCalendar, FiTag, FiUser, FiMaximize2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Gallery = () => {
  const { user } = useAuth();
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    year: '', // Default to all years
    featured: false
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    year: '', // Default to all years for upload form
    eventId: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'arts', label: 'Arts' },
    { value: 'activities', label: 'Activities' },
    { value: 'achievements', label: 'Achievements' },
    { value: 'other', label: 'Other' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const canUpload = user && ['cessca_staff', 'admin'].includes(user.role);

  useEffect(() => {
    loadGallery();
  }, [filters]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.year) params.year = filters.year;
      if (filters.featured) params.featured = 'true';

      const data = await sportsService.getGallery(params);
      setGallery(data.gallery);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress({ current: 0, total: imageFiles.length });

      // Generate unique album ID for this batch
      const albumId = `ALBUM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Upload each image with the same metadata and album ID
      for (let i = 0; i < imageFiles.length; i++) {
        const formData = new FormData();
        formData.append('image', imageFiles[i]);
        formData.append('title', `${uploadForm.title} - Photo ${i + 1}`);
        formData.append('description', uploadForm.description || '');
        formData.append('category', uploadForm.category);
        formData.append('year', uploadForm.year);
        formData.append('albumId', albumId);
        formData.append('photoOrder', i + 1);
        if (uploadForm.eventId) formData.append('eventId', uploadForm.eventId);

        await sportsService.uploadToGallery(formData);
        setUploadProgress({ current: i + 1, total: imageFiles.length });
      }
      
      // Reset form and reload gallery
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        description: '',
        category: '',
        year: new Date().getFullYear(),
        eventId: ''
      });
      setImageFiles([]);
      setImagePreviews([]);
      setUploadProgress({ current: 0, total: 0 });
      loadGallery();
      alert(`${imageFiles.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleFeatured = async (galleryId, currentFeatured) => {
    try {
      await sportsService.toggleFeatured(galleryId, !currentFeatured);
      loadGallery();
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update featured status');
    }
  };

  const handleDeletePhoto = async (galleryId) => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      await sportsService.deleteFromGallery(galleryId);
      
      // If there are more photos in the album, reload the album
      if (albumPhotos.length > 1) {
        const updatedPhotos = albumPhotos.filter(p => p.gallery_id !== galleryId);
        setAlbumPhotos(updatedPhotos);
        // Adjust index if needed
        if (currentPhotoIndex >= updatedPhotos.length) {
          setCurrentPhotoIndex(updatedPhotos.length - 1);
        }
      } else {
        // Last photo in album, close modal and reload gallery
        setShowImageModal(false);
        setAlbumPhotos([]);
      }
      
      await loadGallery();
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(error.response?.data?.message || 'Failed to delete photo');
    }
  };

  const openAlbumModal = async (album) => {
    try {
      setSelectedAlbum(album);
      const data = await sportsService.getAlbumPhotos(album.album_id);
      setAlbumPhotos(data.photos);
      setCurrentPhotoIndex(0);
      setShowImageModal(true);
    } catch (error) {
      console.error('Error loading album photos:', error);
      alert('Failed to load album photos');
    }
  };

  const navigatePhoto = (direction) => {
    if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (direction === 'next' && currentPhotoIndex < albumPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const getCurrentPhoto = () => albumPhotos[currentPhotoIndex] || null;

  const getCategoryBadgeVariant = (category) => {
    const variants = {
      sports: 'success',
      cultural: 'info',
      arts: 'warning',
      activities: 'primary',
      achievements: 'success',
      other: 'secondary'
    };
    return variants[category] || 'secondary';
  };

  const toggleDescription = (albumId) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) {
        newSet.delete(albumId);
      } else {
        newSet.add(albumId);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl h-[20rem] md:h-[23rem] border border-green-900"
          style={{
            backgroundImage: `linear-gradient(115deg, rgba(5, 74, 26, 0.88) 0%, rgba(0, 108, 27, 0.8) 52%, rgba(7, 64, 21, 0.88) 100%), url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_40%,rgba(250,204,21,0.2),transparent_38%),radial-gradient(circle_at_78%_60%,rgba(34,197,94,0.22),transparent_40%)]" />
          <div className="relative z-10 h-full flex items-center px-6 md:px-10">
            <div className="max-w-2xl">
              <p className="text-yellow-300 font-semibold tracking-wider uppercase text-xs md:text-sm mb-3">
                PTC CESSCA
              </p>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-yellow-300 drop-shadow-lg">
                Arts, Culture,
                <span className="block text-white">and Sports Office</span>
              </h1>
              <p className="text-green-100 mt-4 text-sm md:text-base max-w-xl">
                Gallery of campus events, performances, competitions, and student achievements.
              </p>

              {canUpload && (
                <Button
                  variant="primary"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-5 !bg-yellow-400 hover:!bg-yellow-300 !text-green-950 border-0"
                >
                  <FiUpload className="mr-2" />
                  Upload Photos
                </Button>
              )}
            </div>
          </div>

          <div className="absolute right-6 top-7 hidden md:flex gap-3 opacity-80">
            <span className="w-7 h-11 border-2 border-yellow-400 -skew-x-[30deg]" />
            <span className="w-7 h-11 border-2 border-yellow-400 -skew-x-[30deg]" />
            <span className="w-7 h-11 border-2 border-yellow-400 -skew-x-[30deg]" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => setFilters({ ...filters, featured: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured Only</span>
              </label>
            </div>
            <div className="flex items-end justify-end text-sm text-gray-600">
              {gallery.length} album{gallery.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading gallery...</div>
          </div>
        ) : gallery.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiImage className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No albums found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or upload new photos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gallery.map((album) => (
              <div key={album.album_id} className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square overflow-hidden bg-gray-100 relative">
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${album.cover_image}`}
                    onError={e => { e.target.onerror = null; e.target.src = '/default-gallery.png'; }}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => openAlbumModal(album)}
                  />
                  {/* Photo count badge */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                    <FiImage />
                    {album.photo_count}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{album.title}</h3>
                    {album.featured && (
                      <FiStar className="text-gold-600 fill-current flex-shrink-0 ml-1" />
                    )}
                  </div>
                  {album.description && (
                    <div className="mb-2">
                      <p className={`text-xs text-gray-600 ${
                        expandedDescriptions.has(album.album_id) ? '' : 'line-clamp-2'
                      }`}>
                        {album.description}
                      </p>
                      {album.description.length > 80 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDescription(album.album_id);
                          }}
                          className="text-green-600 hover:text-green-800 text-xs font-medium mt-1"
                        >
                          {expandedDescriptions.has(album.album_id) ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant={getCategoryBadgeVariant(album.category)} className="text-xs">
                      {album.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {album.year}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{album.uploaded_by_first_name} {album.uploaded_by_last_name}</span>
                    <button
                      onClick={() => openAlbumModal(album)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <FiMaximize2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sports Events Cross-Link */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">View Upcoming Events</h3>
              <p className="text-gray-600 text-sm">Explore and register for sports, cultural, and artistic events happening on campus</p>
            </div>
            <a
              href="/sports"
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors"
            >
              <FiCalendar size={16} />
              View Events
            </a>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Upload Photos</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setImageFiles([]);
                  setImagePreviews([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6">
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images * (Select multiple photos for the same event)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {imagePreviews.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <FiX className="text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <label
                          htmlFor="image-upload"
                          className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
                        >
                          Add More Photos
                        </label>
                      </div>
                    ) : (
                      <div>
                        <FiImage className="text-4xl text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to select multiple photos</p>
                        <p className="text-xs text-gray-500">JPEG, PNG, GIF up to 5MB each</p>
                        <label
                          htmlFor="image-upload"
                          className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
                        >
                          Select Photos
                        </label>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                  </div>
                  {imagePreviews.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {imagePreviews.length} photo{imagePreviews.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event/Album Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    placeholder="e.g., PTC Dance Competition 2024"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    All photos will be numbered automatically (e.g., "Dance Competition - Photo 1", "Photo 2", etc.)
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    placeholder="Describe the event or photos"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  >
                    <option value="">Select Category</option>
                    {categories.slice(1).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    required
                    value={uploadForm.year}
                    onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && uploadProgress.total > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading photos...</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setImageFiles([]);
                    setImagePreviews([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  disabled={uploading || imageFiles.length === 0}
                >
                  {uploading 
                    ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` 
                    : `Upload ${imageFiles.length} Photo${imageFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Album Viewer Modal */}
      {showImageModal && selectedAlbum && albumPhotos.length > 0 && getCurrentPhoto() && (
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
                <h3 className="text-xl font-bold mb-1">{selectedAlbum.title}</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant={getCategoryBadgeVariant(selectedAlbum.category)}>
                    {selectedAlbum.category}
                  </Badge>
                  <Badge variant="secondary">{selectedAlbum.year}</Badge>
                  {selectedAlbum.featured && (
                    <Badge variant="warning">
                      <FiStar className="inline mr-1" />
                      Featured
                    </Badge>
                  )}
                  {albumPhotos.length > 1 && (
                    <span className="text-sm text-gray-300">
                      {currentPhotoIndex + 1} / {albumPhotos.length}
                    </span>
                  )}
                  <span className="text-sm text-gray-400">
                    • {selectedAlbum.uploaded_by_first_name} {selectedAlbum.uploaded_by_last_name}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                {canUpload && (
                  <>
                    <button
                      onClick={() => handleToggleFeatured(getCurrentPhoto().gallery_id, getCurrentPhoto().featured)}
                      className={`px-3 py-2 rounded-md transition-colors ${
                        getCurrentPhoto().featured
                          ? 'bg-gold-600 hover:bg-gold-700'
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white`}
                      title="Toggle Featured"
                    >
                      <FiStar className={getCurrentPhoto().featured ? 'fill-current' : ''} />
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(getCurrentPhoto().gallery_id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      title="Delete Photo"
                    >
                      <FiTrash2 />
                    </button>
                  </>
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
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${getCurrentPhoto().image_url}`}
                onError={e => { e.target.onerror = null; e.target.src = '/default-gallery.png'; }}
                alt={selectedAlbum.title}
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
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${photo.image_url}`}
                        onError={e => { e.target.onerror = null; e.target.src = '/default-gallery.png'; }}
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
    </Layout>
  );
};

export default Gallery;
