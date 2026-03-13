import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { helpDeskService } from '../services/helpDeskService';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiSend, FiUpload, FiX } from 'react-icons/fi';

const NewTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect staff/admin to admin panel
  useEffect(() => {
    if (user && user.role !== 'student' && user.role !== 'officer') {
      navigate('/admin/help-desk');
    }
  }, [user, navigate]);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'normal',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'technical', label: 'Technical Issue' },
    { value: 'organization', label: 'Organization Related' },
    { value: 'event', label: 'Event Related' },
    { value: 'academic', label: 'Academic' },
    { value: 'facility', label: 'Facility Issue' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'feedback', label: 'Feedback/Suggestion' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', description: 'Non-urgent, can wait' },
    { value: 'normal', label: 'Normal', description: 'Standard priority' },
    { value: 'high', label: 'High', description: 'Important, needs attention' },
    { value: 'urgent', label: 'Urgent', description: 'Critical, needs immediate attention' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file size (10MB max per file)
    const invalidFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Some files exceed 10MB. Please select smaller files.');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];
    const invalidTypeFiles = selectedFiles.filter(file => !allowedTypes.includes(file.type));
    if (invalidTypeFiles.length > 0) {
      setError('Some files have invalid format. Only PDF, DOC, DOCX, JPEG, PNG, and TXT are allowed.');
      return;
    }

    setFiles([...files, ...selectedFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    if (!formData.subject.trim()) {
      setError('Please provide a subject');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a description');
      return;
    }

    try {
      setLoading(true);
      
      // Submit the ticket
      const response = await helpDeskService.submitTicket(formData);
      const ticketId = response.ticketId;

      // Upload attachments if any
      if (files.length > 0) {
        for (const file of files) {
          await helpDeskService.uploadAttachment(ticketId, file);
        }
      }

      // Navigate to the ticket details page
      navigate(`/help-desk/${ticketId}`, {
        state: { message: 'Ticket submitted successfully!' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket. Please try again.');
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/help-desk')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Submit Support Ticket</h1>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Choose the category that best describes your issue
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief summary of your issue..."
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="6"
                placeholder="Provide detailed information about your issue. Include steps to reproduce if applicable..."
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Be as detailed as possible to help us resolve your issue quickly
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {priorities.map((priority) => (
                  <label
                    key={priority.value}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.priority === priority.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={handleChange}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{priority.label}</div>
                      <div className="text-sm text-gray-600">{priority.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FiUpload className="mx-auto text-4xl text-gray-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="text-primary-600 hover:text-primary-700 font-medium">
                    Click to upload
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPEG, PNG, or TXT (Max 10MB per file)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Screenshots or documents that help explain your issue
                </p>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 text-sm text-gray-900">
                        <FiUpload className="text-gray-400" />
                        <span>{file.name}</span>
                        <span className="text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/help-desk')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Submitting...
                  </>
                ) : (
                  <>
                    <FiSend className="mr-2" /> Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">What to Expect</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>You'll receive a unique ticket number</li>
                <li>Our team will review your ticket</li>
                <li>You'll get email notifications on updates</li>
                <li>You can track progress in your dashboard</li>
                <li>You can add more details anytime</li>
              </ul>
            </div>
          </Card>

          <Card>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Tips for Best Results</h3>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Be specific and detailed in your description</li>
                <li>Include screenshots if applicable</li>
                <li>Mention what you've already tried</li>
                <li>Use appropriate priority level</li>
                <li>Check for similar resolved tickets first</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default NewTicket;
