import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { announcementsApi, coursesApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
import './AnnouncementsPage.css';

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    pinned: false,
    cancelled: false,
  });
  const toast = useToast();
  const { user = {} } = useAuth();
  const isAdmin = user.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();
  const openFromQuery = new URLSearchParams(location.search).get('new') === '1';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!openFromQuery || !isAdmin) return;

    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      courseId: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      pinned: false,
      cancelled: false,
    });
    setShowModal(true);
    navigate('/announcements', { replace: true });
  }, [openFromQuery, isAdmin, navigate]);

  const fetchData = async () => {
    try {
      const [announcementsData, coursesData] = await Promise.all([
        announcementsApi.getAll(),
        coursesApi.getAll(),
      ]);
      setAnnouncements(announcementsData);
      setCourses(coursesData);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await announcementsApi.update(editingAnnouncement._id, formData);
        toast.success('Announcement updated');
      } else {
        await announcementsApi.create(formData);
        toast.success('Announcement posted');
      }
      setShowModal(false);
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        courseId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        pinned: false,
        cancelled: false,
      });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      courseId: announcement.courseId?._id || announcement.courseId || '',
      date: announcement.date || new Date().toISOString().split('T')[0],
      time: announcement.time || '',
      location: announcement.location || '',
      pinned: Boolean(announcement.pinned),
      cancelled: Boolean(announcement.cancelled),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await announcementsApi.delete(id);
        toast.success('Announcement deleted');
        fetchData();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId || c._id === courseId?._id);
    return course?.name || 'All Courses';
  };

  if (loading) return <div className="loading">Loading announcements...</div>;

  return (
    <div className="announcements-page">
      <div className="page-header">
        <h2>Announcements</h2>
        {isAdmin && (
          <button
            className="add-btn"
            onClick={() => {
              setEditingAnnouncement(null);
              setFormData({
                title: '',
                content: '',
                courseId: '',
                date: new Date().toISOString().split('T')[0],
                time: '',
                location: '',
                pinned: false,
                cancelled: false,
              });
              setShowModal(true);
            }}
          >
            📢 Post Announcement
          </button>
        )}
      </div>

      <div className="announcements-list">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div
              key={announcement._id}
              className={`announcement-card${announcement.pinned ? ' pinned' : ''}${announcement.cancelled ? ' cancelled' : ''}`}
            >
              <div className="announcement-header">
                <span className="announcement-course">{getCourseName(announcement.courseId)}</span>
                <div className="announcement-tags">
                  {announcement.pinned && <span className="tag pinned">Pinned</span>}
                  {announcement.cancelled && <span className="tag cancelled">Cancelled</span>}
                </div>
                {isAdmin && (
                  <div className="announcement-actions">
                    <button onClick={() => handleEdit(announcement)}>✏️</button>
                    <button onClick={() => handleDelete(announcement._id)}>🗑️</button>
                  </div>
                )}
              </div>
              <h3 className="announcement-title">{announcement.title}</h3>
              <p className="announcement-content">{announcement.content}</p>
              <div className="announcement-footer">
                <span className="announcement-date">
                  📅 {announcement.date || (announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : '')}
                  {announcement.time ? ` • ${announcement.time}` : ''}
                  {announcement.location ? ` • ${announcement.location}` : ''}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">No announcements yet</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAnnouncement ? 'Edit Announcement' : 'Post Announcement'}>
        <form onSubmit={handleSubmit} className="announcement-form">
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Course (optional)</label>
            <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}>
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.name}</option>
              ))}
            </select>
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
            <label>Location</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows="5" required />
          </div>
          <div className="form-row">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
              />
              Pin announcement
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={formData.cancelled}
                onChange={(e) => setFormData({ ...formData, cancelled: e.target.checked })}
              />
              Mark as cancelled
            </label>
          </div>
          <button type="submit" className="submit-btn">{editingAnnouncement ? 'Update' : 'Post'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default AnnouncementsPage;
