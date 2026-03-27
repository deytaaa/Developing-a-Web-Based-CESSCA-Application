// ImageModal for lightbox view
const ImageModal = ({ src, alt, open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={onClose}>
      <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
        <img src={src} alt={alt} className="w-full h-auto max-h-[80vh] rounded-lg shadow-lg bg-white" />
        <button onClick={onClose} className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1.5 shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};
import React, { useState, useEffect, useCallback } from 'react';
// ─── Achievement Description with Read More ─────────────
const AchievementDescription = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  if (!description) return null;
  const limit = 120;
  const isLong = description.length > limit;
  return (
    <p className="text-xs text-gray-500 mb-2">
      {expanded || !isLong ? description : description.slice(0, limit) + '...'}
      {isLong && !expanded && (
        <button className="text-blue-600 ml-1 text-xs underline" onClick={() => setExpanded(true)}>
          Read more
        </button>
      )}
      {isLong && expanded && (
        <button className="text-blue-600 ml-1 text-xs underline" onClick={() => setExpanded(false)}>
          Read less
        </button>
      )}
    </p>
  );
};
import Layout from '../components/Layout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import heroBg from '../assets/images/loginbg.jpg';
import { achievementService } from '../services/achievementService';
import { useAuth } from '../contexts/AuthContext';
import {
  FiAward, FiPlus, FiEdit2, FiTrash2, FiStar, FiFilter,
  FiCalendar, FiX, FiUpload, FiSearch,
} from 'react-icons/fi';

const CATEGORIES = ['academic', 'sports', 'cultural', 'community', 'other'];
const AWARD_LEVELS = ['international', 'national', 'regional', 'local', 'institutional'];

const CATEGORY_COLORS = {
  academic:    'bg-blue-100 text-blue-800',
  sports:      'bg-green-100 text-green-800',
  cultural:    'bg-purple-100 text-purple-800',
  community:   'bg-orange-100 text-orange-800',
  other:       'bg-gray-100 text-gray-700',
};

const LEVEL_COLORS = {
  international: 'bg-red-100 text-red-800',
  national:      'bg-yellow-100 text-yellow-800',
  regional:      'bg-indigo-100 text-indigo-800',
  local:         'bg-teal-100 text-teal-800',
  institutional: 'bg-gray-100 text-gray-700',
};

const LEVEL_ICONS = {
  international: '🌍',
  national:      '🇵🇭',
  regional:      '🏅',
  local:         '📍',
  institutional: '🏫',
};

const CATEGORY_ICONS = {
  academic:  '🎓',
  sports:    '🏆',
  cultural:  '🎭',
  community: '🤝',
  other:     '⭐',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  achievement_date: '',
  category: 'academic',
  award_level: 'national',
  recipient: '',
  is_featured: false,
  image: null,
};

const Achievements = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filters, setFilters]           = useState({ category: '', award_level: '', year: '', search: '' });
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filters.category)   params.category   = filters.category;
      if (filters.award_level) params.award_level = filters.award_level;
      if (filters.year)        params.year        = filters.year;
      const res = await achievementService.getAll(params);
      setAchievements(res.achievements || []);
      setTotal(res.total || 0);
    } catch {
      setAchievements([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.award_level, filters.year, page, limit]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filters.category, filters.award_level, filters.year, filters.search]);

  const openCreate = () => {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditTarget(a);
    setFormData({
      title: a.title,
      description: a.description || '',
      achievement_date: a.achievement_date?.split('T')[0] || '',
      category: a.category,
      award_level: a.award_level,
      recipient: a.recipient || '',
      is_featured: Boolean(a.is_featured),
      image: null,
    });
    setPreviewUrl(a.image_url ? `http://localhost:5000${a.image_url}` : null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((f) => ({ ...f, image: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'image' && v) { fd.append('image', v); return; }
        if (k === 'image') return;
        fd.append(k, String(v));
      });

      if (editTarget) {
        await achievementService.update(editTarget.achievement_id, fd);
      } else {
        await achievementService.create(fd);
      }
      setModalOpen(false);
      load();
    } catch {
      // errors handled silently; could add toast notification
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await achievementService.delete(id);
      setDeleteConfirm(null);
      load();
    } catch {
      // silent
    }
  };

  const filtered = achievements.filter((a) =>
    !filters.search ||
    a.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    (a.recipient || '').toLowerCase().includes(filters.search.toLowerCase())
  );

  const featured  = filtered.filter((a) => a.is_featured);
  const rest      = filtered.filter((a) => !a.is_featured);

  // Generate year options from data
  const years = [...new Set(achievements.map((a) => new Date(a.achievement_date).getFullYear()))].sort((a, b) => b - a);

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
                School
                <span className="block text-white">Achievements</span>
              </h1>
              <p className="text-green-100 mt-4 text-sm md:text-base max-w-xl">
                Celebrating the excellence and milestones of Pateros Technological College.
              </p>

              {(user?.role === 'admin' || user?.role === 'cessca_staff') && (
                <button
                  onClick={openCreate}
                  className="mt-5 inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-green-950 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors"
                >
                  <FiPlus size={16} />
                  Add Achievement
                </button>
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
        <Card className="!p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search achievements…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select
              value={filters.award_level}
              onChange={(e) => setFilters((f) => ({ ...f, award_level: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Levels</option>
              {AWARD_LEVELS.map((l) => (
                <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {(filters.category || filters.award_level || filters.year || filters.search) && (
            <button
              onClick={() => setFilters({ category: '', award_level: '', year: '', search: '' })}
              className="mt-3 text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <FiX size={12} /> Clear filters
            </button>
          )}
        </Card>

        {loading ? (
          <LoadingSpinner centered size="lg" />
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <FiAward className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No achievements found</p>
            <p className="text-gray-400 text-sm mt-1">
              {isAdmin ? 'Click "Add Achievement" to record the first one.' : 'No records match your filters.'}
            </p>
          </Card>
        ) : (
          <>
            {/* Featured Section */}
            {featured.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FiStar className="text-yellow-500" /> Featured Achievements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((a) => <AchievementCard key={a.achievement_id} achievement={a} user={user} onEdit={openEdit} onDelete={setDeleteConfirm} featured />)}
                </div>
              </div>
            )}

            {/* All Others */}
            {rest.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <h2 className="text-lg font-bold text-gray-800 mb-3">All Achievements</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((a) => <AchievementCard key={a.achievement_id} achievement={a} user={user} onEdit={openEdit} onDelete={setDeleteConfirm} />)}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-xs text-gray-500">
                Page {page} of {Math.ceil(total / limit) || 1} | {total} achievements
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
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Achievement' : 'Add New Achievement'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g. National Quiz Bowl Champions"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Award Level <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.award_level}
                onChange={(e) => setFormData((f) => ({ ...f, award_level: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              >
                {AWARD_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Achievement Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.achievement_date}
                onChange={(e) => setFormData((f) => ({ ...f, achievement_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient / Team</label>
              <input
                value={formData.recipient}
                onChange={(e) => setFormData((f) => ({ ...f, recipient: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                placeholder="e.g. PTC Varsity Team"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Brief description of the achievement..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-green-400 transition-colors">
              <FiUpload className="text-gray-400" />
              <span className="text-sm text-gray-500">{formData.image ? formData.image.name : 'Click to upload image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) => setFormData((f) => ({ ...f, is_featured: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
              Mark as Featured Achievement
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Achievement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Achievement" size="sm">
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={() => handleDelete(deleteConfirm.achievement_id)}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </Layout>
  );
};

// ─── Achievement Card Component ───────────────────────────────────────────────
const AchievementCard = ({ achievement: a, user, onEdit, onDelete, featured }) => {
  const dateStr = a.achievement_date
    ? new Date(a.achievement_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const [imgModalOpen, setImgModalOpen] = useState(false);

  return (
    <div className={`bg-white rounded-xl shadow-md flex flex-col overflow-hidden border border-gray-100 relative ${featured ? 'ring-2 ring-yellow-400 shadow-yellow-100' : ''}`}> 
      {/* Image at top */}
      <div className="relative w-full bg-white flex items-center justify-center cursor-pointer group" style={{ aspectRatio: '4/5', minHeight: 260, maxHeight: 340 }} onClick={() => a.image_url && setImgModalOpen(true)}>
        {a.image_url ? (
          <img
            src={`http://localhost:5000${a.image_url}`}
            alt={a.title}
            className="w-full h-full object-contain group-hover:opacity-80 transition"
            style={{ maxHeight: 320, maxWidth: '100%' }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-5xl text-gray-300">{CATEGORY_ICONS[a.category]}</span>
        )}
        {featured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
            <FiStar size={10} /> Featured
          </div>
        )}
        {(user?.role === 'admin' || user?.role === 'cessca_staff') && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={e => { e.stopPropagation(); onEdit(a); }}
              className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-green-700 rounded-md shadow-sm transition-all"
              title="Edit"
            >
              <FiEdit2 size={13} />
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(a); }}
                className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-red-600 rounded-md shadow-sm transition-all"
                title="Delete"
              >
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
        )}
        {/* Modal for full image */}
        <ImageModal src={`http://localhost:5000${a.image_url}`} alt={a.title} open={imgModalOpen} onClose={() => setImgModalOpen(false)} />
      </div>
      {/* Card Content */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-2">
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{a.title}</h3>
        <div className="flex items-center text-xs text-gray-500 mb-1">
          <FiCalendar className="mr-1" size={13} /> {dateStr}
        </div>
        {a.recipient && <div className="text-xs text-green-700 font-medium mb-1">By {a.recipient}</div>}
        <AchievementDescription description={a.description} />
        <div className="flex flex-wrap gap-1.5 mt-auto mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>
            {CATEGORY_ICONS[a.category]} {a.category.charAt(0).toUpperCase() + a.category.slice(1)}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[a.award_level]}`}> 
            {LEVEL_ICONS[a.award_level]} {a.award_level.charAt(0).toUpperCase() + a.award_level.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
