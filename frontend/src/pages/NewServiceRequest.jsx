import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { serviceRequestService } from '../services/serviceRequestService';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiSend, FiUpload, FiX } from 'react-icons/fi';

const NewServiceRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect staff/admin to admin panel
  useEffect(() => {
    if (user && user.role !== 'student' && user.role !== 'officer') {
      navigate('/admin/service-requests');
    }
  }, [user, navigate]);
  const [formData, setFormData] = useState({
    request_type: '',
    purpose: '',
    priority: 'normal',
    additional_details: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestTypes = [
    { value: 'certificate_enrollment', label: 'Certificate of Enrollment' },
    { value: 'certificate_good_moral', label: 'Certificate of Good Moral Character' },
    { value: 'certificate_grades', label: 'Certificate of Grades' },
    { value: 'clearance', label: 'Clearance' },
    { value: 'id_replacement', label: 'ID Replacement' },
    { value: 'org_membership_certificate', label: 'Organization Membership Certificate' },
    { value: 'event_participation_certificate', label: 'Event Participation Certificate' },
    { value: 'other', label: 'Other' },
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
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    const invalidTypeFiles = selectedFiles.filter(file => !allowedTypes.includes(file.type));
    if (invalidTypeFiles.length > 0) {
      setError('Some files have invalid format. Only PDF, DOC, DOCX, JPEG, and PNG are allowed.');
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
    if (!formData.request_type) {
      setError('Please select a request type');
      return;
    }
    if (!formData.purpose.trim()) {
      setError('Please provide the purpose of your request');
      return;
    }

    try {
      setLoading(true);
      
      // Submit the request
      const response = await serviceRequestService.submitRequest(formData);
      
      if (!response.success || !response.request || !response.request.request_id) {
        throw new Error('Invalid response from server');
      }
      
      const requestId = response.request.request_id;

      // Upload attachments if any
      if (files.length > 0) {
        for (const file of files) {
          try {
            await serviceRequestService.uploadAttachment(requestId, file);
          } catch (uploadErr) {
            console.error('Error uploading attachment:', uploadErr);
            // Continue with other files even if one fails
          }
        }
      }

      // Navigate to the request details page
      navigate(`/service-requests/${requestId}`, {
        state: { message: 'Request submitted successfully!' }
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit request. Please try again.');
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
            onClick={() => navigate('/service-requests')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Request Student Services</h1>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Type <span className="text-red-500">*</span>
              </label>
              <select
                name="request_type"
                value={formData.request_type}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select a request type</option>
                {requestTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose <span className="text-red-500">*</span>
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the purpose of your request..."
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={formData.priority === 'normal'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Normal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value="urgent"
                    checked={formData.priority === 'urgent'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-gray-900">Urgent</span>
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Select "Urgent" only for time-sensitive requests
              </p>
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                name="additional_details"
                value={formData.additional_details}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional information that might be helpful..."
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
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
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPEG, or PNG (Max 10MB per file)
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
                onClick={() => navigate('/service-requests')}
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
                    <FiSend className="mr-2" /> Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Information Card */}
        <Card>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Information</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Processing time varies depending on the type of request</li>
              <li>You will receive notifications about the status of your request</li>
              <li>Make sure all information provided is accurate and complete</li>
              <li>You can cancel your request while it's still pending</li>
              <li>For urgent matters, please select "Urgent" priority</li>
            </ul>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default NewServiceRequest;
