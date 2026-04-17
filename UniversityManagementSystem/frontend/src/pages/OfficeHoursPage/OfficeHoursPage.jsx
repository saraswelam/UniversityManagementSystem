import { useState, useEffect } from 'react';
import { officeHoursApi, coursesApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './OfficeHoursPage.css';

function OfficeHoursPage() {
  const [officeHours, setOfficeHours] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ day: '', startTime: '', endTime: '', location: '', courseId: '' });
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [officeHoursData, coursesData] = await Promise.all([
        officeHoursApi.getAll(),
        coursesApi.getAll(),
      ]);
      setOfficeHours(officeHoursData);
      setCourses(coursesData);
    } catch (error) {
      toast.error('Failed to load office hours');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await officeHoursApi.update(editingItem._id, formData);
        toast.success('Office hours updated');
      } else {
        await officeHoursApi.create(formData);
        toast.success('Office hours created');
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ day: '', startTime: '', endTime: '', location: '', courseId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      courseId: item.courseId?._id || item.courseId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete these office hours?')) {
      try {
        await officeHoursApi.delete(id);
        toast.success('Office hours deleted');
        fetchData();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId || c._id === courseId?._id);
    return course?.name || 'General';
  };

  if (loading) return <div className="loading">Loading office hours...</div>;

  return (
    <div className="office-hours-page">
      <div className="page-header">
        <h2>Office Hours</h2>
        <button className="add-btn" onClick={() => { setEditingItem(null); setFormData({ day: '', startTime: '', endTime: '', location: '', courseId: '' }); setShowModal(true); }}>
          ➕ Add Office Hours
        </button>
      </div>

      <div className="office-hours-list">
        {officeHours.length > 0 ? (
          officeHours.map((item) => (
            <div key={item._id} className="office-hours-card">
              <div className="office-hours-header">
                <span className="office-hours-day">{item.day}</span>
                <div className="office-hours-actions">
                  <button onClick={() => handleEdit(item)}>✏️</button>
                  <button onClick={() => handleDelete(item._id)}>🗑️</button>
                </div>
              </div>
              <div className="office-hours-details">
                <p>🕐 {item.startTime} - {item.endTime}</p>
                <p>📍 {item.location || 'TBD'}</p>
                <p>📚 {getCourseName(item.courseId)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">No office hours scheduled</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Office Hours' : 'Add Office Hours'}>
        <form onSubmit={handleSubmit} className="office-hours-form">
          <div className="form-group">
            <label>Day</label>
            <select value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })} required>
              <option value="">Select day</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Room 301" />
          </div>
          <div className="form-group">
            <label>Course (optional)</label>
            <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}>
              <option value="">General</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-btn">{editingItem ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default OfficeHoursPage;