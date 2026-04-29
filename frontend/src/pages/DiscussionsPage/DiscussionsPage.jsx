import { useState, useEffect } from 'react';
import { discussionsApi, coursesApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './DiscussionsPage.css';

function DiscussionsPage() {
  const [discussions, setDiscussions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', courseId: '' });
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [discussionsData, coursesData] = await Promise.all([
        discussionsApi.getAll(),
        coursesApi.getAll(),
      ]);
      setDiscussions(discussionsData);
      setCourses(coursesData);
    } catch (error) {
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDiscussion) {
        await discussionsApi.update(editingDiscussion._id, formData);
        toast.success('Discussion updated');
      } else {
        await discussionsApi.create(formData);
        toast.success('Discussion created');
      }
      setShowModal(false);
      setEditingDiscussion(null);
      setFormData({ title: '', content: '', courseId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (discussion) => {
    setEditingDiscussion(discussion);
    setFormData({
      title: discussion.title,
      content: discussion.content,
      courseId: discussion.courseId?._id || discussion.courseId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this discussion?')) {
      try {
        await discussionsApi.delete(id);
        toast.success('Discussion deleted');
        fetchData();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId || c._id === courseId?._id);
    return course?.name || 'No Course';
  };

  if (loading) return <div className="loading">Loading discussions...</div>;

  return (
    <div className="discussions-page">
      <div className="page-header">
        <h2>Discussions</h2>
        <button className="add-btn" onClick={() => { setEditingDiscussion(null); setFormData({ title: '', content: '', courseId: '' }); setShowModal(true); }}>
          ➕ New Discussion
        </button>
      </div>

      <div className="discussions-list">
        {discussions.length > 0 ? (
          discussions.map((discussion) => (
            <div key={discussion._id} className="discussion-card">
              <div className="discussion-header">
                <span className="discussion-course">{getCourseName(discussion.courseId)}</span>
                <div className="discussion-actions">
                  <button onClick={() => handleEdit(discussion)}>✏️</button>
                  <button onClick={() => handleDelete(discussion._id)}>🗑️</button>
                </div>
              </div>
              <h3 className="discussion-title">{discussion.title}</h3>
              <p className="discussion-content">{discussion.content}</p>
              <div className="discussion-footer">
                <span className="comment-count">💬 {discussion.comments?.length || 0} comments</span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">No discussions yet</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDiscussion ? 'Edit Discussion' : 'New Discussion'}>
        <form onSubmit={handleSubmit} className="discussion-form">
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Course</label>
            <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} required>
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows="4" required />
          </div>
          <button type="submit" className="submit-btn">{editingDiscussion ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default DiscussionsPage;