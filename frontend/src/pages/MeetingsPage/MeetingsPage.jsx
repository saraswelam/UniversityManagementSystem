import { useState, useEffect } from 'react';
import { meetingsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
import './MeetingsPage.css';

function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [formData, setFormData] = useState({ title: '', date: '', time: '', link: '', description: '' });
  const toast = useToast();
  const { user = {} } = useAuth();
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const data = await meetingsApi.getAll();
      setMeetings(data);
    } catch (error) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMeeting) {
        await meetingsApi.update(editingMeeting._id, formData);
        toast.success('Meeting updated');
      } else {
        await meetingsApi.create(formData);
        toast.success('Meeting scheduled');
      }
      setShowModal(false);
      setEditingMeeting(null);
      setFormData({ title: '', date: '', time: '', link: '', description: '' });
      fetchMeetings();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      date: meeting.date?.split('T')[0] || '',
      time: meeting.time || '',
      link: meeting.link || '',
      description: meeting.description || '',
    });
    setShowModal(true);
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this meeting?')) {
      try {
        await meetingsApi.updateStatus(id, 'cancelled');
        toast.success('Meeting cancelled');
        fetchMeetings();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  if (loading) return <div className="loading">Loading meetings...</div>;

  return (
    <div className="meetings-page">
      <div className="page-header">
        <h2>Meetings</h2>
        <button className="add-btn" onClick={() => { setEditingMeeting(null); setFormData({ title: '', date: '', time: '', link: '', description: '' }); setShowModal(true); }}>
          ➕ Schedule Meeting
        </button>
      </div>

      <div className="meetings-list">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <div key={meeting._id} className={`meeting-card ${meeting.status}`}>
              <div className="meeting-header">
                <span className="meeting-date">
                  📅 {meeting.date ? new Date(meeting.date).toLocaleDateString() : 'TBD'}
                  {meeting.time && ` at ${meeting.time}`}
                </span>
                <span className={`status-badge ${meeting.status || 'pending'}`}>
                  {meeting.status || 'pending'}
                </span>
                <div className="meeting-actions">
                  {isAdmin && <button onClick={() => handleEdit(meeting)}>✏️</button>}
                  {isAdmin && meeting.status !== 'cancelled' && (
                    <button onClick={() => handleCancel(meeting._id)}>🗑️</button>
                  )}
                </div>
              </div>
              <h3 className="meeting-title">{meeting.title}</h3>
              <p className="meeting-description">{meeting.description}</p>
              {meeting.link && (
                <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="meeting-link">
                  🔗 Join Meeting
                </a>
              )}
            </div>
          ))
        ) : (
          <p className="empty-message">No meetings scheduled</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'}>
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Meeting Link</label>
            <input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
          </div>
          <button type="submit" className="submit-btn">{editingMeeting ? 'Update' : 'Schedule'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default MeetingsPage;
