import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { sportsService } from '../services/sportsService';
import { useAuth } from '../contexts/AuthContext';
import { FiCalendar, FiMapPin, FiUsers, FiAward, FiPlus, FiClock, FiX } from 'react-icons/fi';

const Sports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', eventType: 'all' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    event_name: '',
    event_type: 'sports',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    max_participants: '',
    registration_deadline: '',
  });

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      const params = {};
      if (filter.status !== 'all') params.status = filter.status;
      if (filter.eventType !== 'all') params.eventType = filter.eventType;
      
      const response = await sportsService.getEvents(params);
      setEvents(response.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode && editingEventId) {
        await sportsService.updateEvent(editingEventId, formData);
      } else {
        await sportsService.createEvent(formData);
      }
      setShowCreateModal(false);
      setIsEditMode(false);
      setEditingEventId(null);
      setFormData({
        event_name: '',
        event_type: 'sports',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        max_participants: '',
        registration_deadline: '',
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await sportsService.registerForEvent(eventId, {});
      alert('Registration successful!');
      loadEvents();
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const viewEventDetails = async (eventId) => {
    try {
      const response = await sportsService.getEventById(eventId);
      setSelectedEvent(response.event);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to load event details:', error);
    }
  };

  const openEditModal = (event) => {
    setIsEditMode(true);
    setEditingEventId(event.event_id);
    setFormData({
      event_name: event.event_name || '',
      event_type: event.event_type || 'sports',
      description: event.description || '',
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 10) : '',
      event_time: event.event_time || '',
      location: event.venue || event.location || '',
      max_participants: event.target_participants || '',
      registration_deadline: '',
      status: event.status || 'upcoming',
    });
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    const confirmed = window.confirm('Delete this event? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await sportsService.deleteEvent(eventId);
      alert('Event deleted successfully.');
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'info',
      ongoing: 'success',
      completed: 'default',
      cancelled: 'danger',
    };
    return colors[status] || 'default';
  };

  const getEventTypeColor = (type) => {
    const colors = {
      sports: 'primary',
      cultural: 'accent',
      competition: 'warning',
      workshop: 'info',
    };
    return colors[type] || 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner centered size="lg" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sports, Culture & Arts</h1>
            <p className="mt-1 text-gray-600">Browse and register for events, competitions, and workshops</p>
          </div>
          {(user?.role === 'cessca_staff' || user?.role === 'admin') && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <FiPlus className="mr-2" />
              Create Event
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filter.eventType}
                onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}
              >
                <option value="all">All Types</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
                <option value="competition">Competition</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <p className="text-center text-gray-500 py-8">No events found</p>
              </Card>
            </div>
          ) : (
            events.map((event) => (
              <Card key={event.event_id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Event Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{event.event_name}</h3>
                      <Badge variant={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <Badge variant={getEventTypeColor(event.event_type)}>
                      {event.event_type}
                    </Badge>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 text-primary-600" />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.event_time && (
                      <div className="flex items-center">
                        <FiClock className="mr-2 text-primary-600" />
                        <span>{formatTime(event.event_time)}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <FiMapPin className="mr-2 text-primary-600" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center">
                      <FiUsers className="mr-2 text-primary-600" />
                      <span>
                        {event.participant_count || 0}
                        {event.max_participants && ` / ${event.max_participants}`} participants
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewEventDetails(event.event_id)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    {(user?.role === 'student' || user?.role === 'officer') && 
                     event.status === 'upcoming' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRegister(event.event_id)}
                        className="flex-1"
                      >
                        Register
                      </Button>
                    )}
                    {(user?.role === 'cessca_staff' || user?.role === 'admin') && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(event)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.event_id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Event' : 'Create New Event'}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={formData.event_name}
                      onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type *
                    </label>
                    <select
                      required
                      className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    >
                      <option value="sports">Sports</option>
                      <option value="cultural">Cultural</option>
                      <option value="competition">Competition</option>
                      <option value="workshop">Workshop</option>
                    </select>
                  </div>

                  {isEditMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        value={formData.status || 'upcoming'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        value={formData.event_date}
                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Time
                      </label>
                      <input
                        type="time"
                        className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        value={formData.event_time}
                        onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., PTC Gymnasium, Main Auditorium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Participants
                      </label>
                      <input
                        type="number"
                        className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Deadline
                      </label>
                      <input
                        type="date"
                        className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        value={formData.registration_deadline}
                        onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" variant="primary" className="flex-1">
                      {isEditMode ? 'Save Changes' : 'Create Event'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setIsEditMode(false);
                        setEditingEventId(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showDetailsModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.event_name}</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Event Info */}
                  <div className="flex space-x-3">
                    <Badge variant={getStatusColor(selectedEvent.status)}>
                      {selectedEvent.status}
                    </Badge>
                    <Badge variant={getEventTypeColor(selectedEvent.event_type)}>
                      {selectedEvent.event_type}
                    </Badge>
                  </div>

                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center">
                      <FiCalendar className="mr-3 text-primary-600" size={20} />
                      <span><strong>Date:</strong> {formatDate(selectedEvent.event_date)}</span>
                    </div>
                    {selectedEvent.event_time && (
                      <div className="flex items-center">
                        <FiClock className="mr-3 text-primary-600" size={20} />
                        <span><strong>Time:</strong> {formatTime(selectedEvent.event_time)}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <FiMapPin className="mr-3 text-primary-600" size={20} />
                      <span><strong>Location:</strong> {selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center">
                      <FiUsers className="mr-3 text-primary-600" size={20} />
                      <span>
                        <strong>Participants:</strong> {selectedEvent.participants?.length || 0}
                        {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{selectedEvent.description}</p>
                  </div>

                  {/* Participants List */}
                  {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <FiUsers className="mr-2" />
                        Registered Participants ({selectedEvent.participants.length})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedEvent.participants.map((participant) => (
                          <div
                            key={participant.participant_id}
                            className="flex items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {participant.first_name} {participant.last_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {participant.student_id} • {participant.course}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {selectedEvent.results && selectedEvent.results.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <FiAward className="mr-2 text-accent-600" />
                        Competition Results
                      </h3>
                      <div className="space-y-2">
                        {selectedEvent.results.map((result) => (
                          <div
                            key={result.result_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center">
                              {result.rank_position <= 3 && (
                                <FiAward
                                  className={`mr-3 ${
                                    result.rank_position === 1
                                      ? 'text-yellow-500'
                                      : result.rank_position === 2
                                      ? 'text-gray-400'
                                      : 'text-orange-600'
                                  }`}
                                  size={24}
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {result.first_name} {result.last_name}
                                </p>
                                {result.score && (
                                  <p className="text-sm text-gray-600">Score: {result.score}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="accent">
                              {result.rank_position === 1
                                ? '1st'
                                : result.rank_position === 2
                                ? '2nd'
                                : result.rank_position === 3
                                ? '3rd'
                                : `${result.rank_position}th`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailsModal(false)}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Sports;
