import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { disciplineService } from '../services/disciplineService';

const Discipline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [formData, setFormData] = useState({
    caseType: 'complaint',
    subject: '',
    description: '',
    isAnonymous: false,
  });

  useEffect(() => {
    fetchCases();
  }, [selectedDate, page, limit]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [selectedDate, limit]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (selectedDate) params.date = selectedDate;
      const data = await disciplineService.getCases(params);
      setCases(data.cases || []);
      setTotal(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      setCases([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await disciplineService.submitCase(formData);
      setShowModal(false);
      alert('Case submitted successfully');
      setFormData({ caseType: 'complaint', subject: '', description: '', isAnonymous: false });
      fetchCases(); // Reload cases after submission
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="text-gray-600">
              {user.role === 'cessca_staff' || user.role === 'admin' 
                ? 'View and manage all discipline cases and consultation requests' 
                : 'View your submitted cases and their current status'}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="date-filter" className="text-sm text-gray-700 font-medium">Filter by date:</label>
              <input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded"
                max={new Date().toISOString().slice(0, 10)}
              />
              {selectedDate && (
                <button
                  className="ml-1 text-xs text-red-500 hover:underline"
                  onClick={() => setSelectedDate('')}
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </Card>

        {loading ? (
          <Card>
            <p className="text-center text-gray-500">Loading cases...</p>
          </Card>
        ) : cases.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500">No cases found</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {cases.map((caseItem) => (
                <Card key={caseItem.case_id} className="hover:shadow-lg transition-shadow">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => navigate(`/discipline/cases/${caseItem.case_id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {caseItem.subject}
                        </h3>
                        {getStatusBadge(caseItem.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Case #{caseItem.case_number}
                      </p>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {caseItem.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="capitalize">
                          Type: {caseItem.case_type.replace('_', ' ')}
                        </span>
                        <span>
                          Submitted: {new Date(caseItem.created_at).toLocaleDateString()}
                        </span>
                        {caseItem.is_anonymous ? (
                          <span className="text-orange-600 font-medium">Anonymous</span>
                        ) : (
                          <span>
                            By: {caseItem.complainant_first_name} {caseItem.complainant_last_name}
                          </span>
                        )}
                        {(caseItem.assigned_first_name || caseItem.assigned_last_name) && (
                          <span className="text-blue-600">
                            Assigned to: {caseItem.assigned_first_name} {caseItem.assigned_last_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {/* Pagination Controls (Achievements style) */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-xs text-gray-500">
                Page {page} of {Math.ceil(total / limit) || 1} | {total} cases
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <button
                  className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                >
                  Next
                </button>
                <select
                  className="ml-2 px-2 py-1 text-xs border rounded"
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value))}
                >
                  {[5, 10, 20, 50].map(l => <option key={l} value={l}>{l} / page</option>)}
                </select>
              </div>
            </div>
          </>
        )}

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
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows="4"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
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
