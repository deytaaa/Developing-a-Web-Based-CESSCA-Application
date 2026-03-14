import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { disciplineService } from '../services/disciplineService';

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: 'pending',
    updateContent: '',
  });

  const [noteForm, setNoteForm] = useState({
    updateType: 'note',
    updateContent: '',
  });

  const canManageCase = useMemo(
    () => user?.role === 'cessca_staff' || user?.role === 'admin',
    [user?.role]
  );

  const canDeleteOwnPendingCase = useMemo(() => {
    if (!user || !caseData) return false;
    const isStudentOrOfficer = user.role === 'student' || user.role === 'officer';
    const isOwner = caseData.complainant_id === user.userId;
    return isStudentOrOfficer && isOwner && caseData.status === 'pending';
  }, [user, caseData]);

  const statusOptions = ['pending', 'ongoing', 'resolved', 'closed', 'escalated'];
  const updateTypeOptions = canManageCase
    ? ['note', 'action', 'resolution']
    : ['note'];

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      setLoading(true);
      const data = await disciplineService.getCaseById(id);
      const currentCase = data.case;
      setCaseData(currentCase);
      setStatusForm((prev) => ({ ...prev, status: currentCase.status }));
    } catch (error) {
      console.error('Failed to fetch case details:', error);
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!statusForm.updateContent.trim()) {
      alert('Please provide an update note for the status change.');
      return;
    }

    try {
      setSavingStatus(true);
      await disciplineService.updateCaseStatus(id, statusForm.status, statusForm.updateContent);
      setStatusForm((prev) => ({ ...prev, updateContent: '' }));
      await loadCase();
      alert('Case status updated successfully.');
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to update case status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();

    if (!noteForm.updateContent.trim()) {
      alert('Please enter update details.');
      return;
    }

    try {
      setSavingNote(true);
      await disciplineService.addUpdate(id, noteForm.updateType, noteForm.updateContent);
      setNoteForm((prev) => ({ ...prev, updateContent: '' }));
      await loadCase();
      alert('Update added successfully.');
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to add update.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteCase = async () => {
    const confirmed = window.confirm('Delete this case? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await disciplineService.deleteCase(id);
      alert('Case deleted successfully.');
      navigate('/discipline');
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to delete case.');
    }
  };

  const getStatusVariant = (status) => {
    if (status === 'resolved' || status === 'closed') return 'success';
    if (status === 'escalated') return 'danger';
    if (status === 'ongoing') return 'info';
    return 'warning';
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner centered size="lg" />
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-700">Case not found or you do not have access.</p>
            <Button className="mt-4" onClick={() => navigate('/discipline')}>
              Back to Discipline
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case Details</h1>
            <p className="text-gray-600 mt-1">{caseData.case_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(caseData.status)}>{caseData.status}</Badge>
            <Button variant="secondary" onClick={() => navigate('/discipline')}>
              Back
            </Button>
          </div>
        </div>

        <Card title="Case Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Subject</p>
              <p className="text-gray-900 font-medium">{caseData.subject}</p>
            </div>
            <div>
              <p className="text-gray-500">Type</p>
              <p className="text-gray-900 capitalize">{caseData.case_type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-500">Priority</p>
              <p className="text-gray-900 capitalize">{caseData.priority}</p>
            </div>
            <div>
              <p className="text-gray-500">Severity</p>
              <p className="text-gray-900 capitalize">{caseData.severity}</p>
            </div>
            <div>
              <p className="text-gray-500">Submitted</p>
              <p className="text-gray-900">{formatDateTime(caseData.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-500">Assigned To</p>
              <p className="text-gray-900">
                {caseData.assigned_first_name || caseData.assigned_last_name
                  ? `${caseData.assigned_first_name || ''} ${caseData.assigned_last_name || ''}`.trim()
                  : 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-gray-500 text-sm">Description</p>
            <p className="text-gray-900 mt-1 whitespace-pre-wrap">{caseData.description}</p>
          </div>

          {canDeleteOwnPendingCase && (
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
              <Button type="button" variant="danger" onClick={handleDeleteCase}>
                Delete Case
              </Button>
            </div>
          )}
        </Card>

        {canManageCase && (
          <Card title="Manage Case">
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Update Note</label>
                <textarea
                  rows="3"
                  value={statusForm.updateContent}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, updateContent: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  placeholder="Explain why this status is being changed"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={savingStatus}>
                  {savingStatus ? 'Saving...' : 'Save Status'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card title="Case Updates">
          {caseData.updates?.length ? (
            <div className="space-y-3 mb-6">
              {caseData.updates.map((update) => (
                <div key={update.update_id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {update.update_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(update.created_at)}</p>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{update.update_content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    By: {update.first_name} {update.last_name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-6">No updates yet.</p>
          )}

          <form onSubmit={handleAddUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Type</label>
              <select
                value={noteForm.updateType}
                onChange={(e) => setNoteForm((prev) => ({ ...prev, updateType: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                {updateTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Update</label>
              <textarea
                rows="3"
                value={noteForm.updateContent}
                onChange={(e) => setNoteForm((prev) => ({ ...prev, updateContent: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="Enter update details"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={savingNote}>
                {savingNote ? 'Posting...' : 'Post Update'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default CaseDetails;
