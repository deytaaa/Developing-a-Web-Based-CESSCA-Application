import { useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { disciplineService } from '../services/disciplineService';

const Discipline = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    caseType: 'complaint',
    subject: '',
    description: '',
    isAnonymous: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await disciplineService.submitCase(formData);
      setShowModal(false);
      alert('Case submitted successfully');
      setFormData({ caseType: 'complaint', subject: '', description: '', isAnonymous: false });
    } catch (error) {
      alert('Failed to submit case');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Discipline & Consultation</h1>
          {(user.role === 'student' || user.role === 'officer') && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Submit New Case
            </Button>
          )}
        </div>

        <Card>
          <p className="text-gray-600">
            View and manage discipline cases and consultation requests
          </p>
        </Card>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Submit New Case"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} className="ml-2">
                Submit
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.caseType}
                onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
              >
                <option value="complaint">Complaint</option>
                <option value="consultation">Consultation</option>
                <option value="counseling">Counseling</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows="4"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                className="h-4 w-4 text-primary-600 rounded"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              />
              <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                Submit anonymously
              </label>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Discipline;
