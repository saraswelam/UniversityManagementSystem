import { useState, useEffect } from 'react';
import { assignmentsApi, coursesApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './AssignmentsPage.css';

function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', courseId: '' });
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsData, coursesData] = await Promise.all([
        assignmentsApi.getAll(),
        coursesApi.getAll(),
      ]);
      setAssignments(assignmentsData);
      setCourses(coursesData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await assignmentsApi.update(editingAssignment._id, formData);
        toast.success('Assignment updated');
      } else {
        await assignmentsApi.create(formData);
        toast.success('Assignment created');
      }
      setShowModal(false);
      setEditingAssignment(null);
      setFormData({ title: '', description: '', dueDate: '', courseId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.split('T')[0] || '',
      courseId: assignment.courseId?._id || assignment.courseId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this assignment?')) {
      try {
        await assignmentsApi.delete(id);
        toast.success('Assignment deleted');
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

  if (loading) return <div className="loading">Loading assignments...</div>;

  return (
    <div className="assignments-page">
      <div className="page-header">
        <h2>Assignments</h2>
        <button className="add-btn" onClick={() => { setEditingAssignment(null); setFormData({ title: '', description: '', dueDate: '', courseId: '' }); setShowModal(true); }}>
          ➕ Add Assignment
        </button>
      </div>

      <div className="assignments-list">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <div key={assignment._id} className="assignment-card">
              <div className="assignment-header">
                <span className="assignment-course">{getCourseName(assignment.courseId)}</span>
                <div className="assignment-actions">
                  <button onClick={() => handleEdit(assignment)}>✏️</button>
                  <button onClick={() => handleDelete(assignment._id)}>🗑️</button>
                </div>
              </div>
              <h3 className="assignment-title">{assignment.title}</h3>
              <p className="assignment-description">{assignment.description}</p>
              <div className="assignment-footer">
                <span className="due-date">📅 Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">No assignments yet</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAssignment ? 'Edit Assignment' : 'Add Assignment'}>
        <form onSubmit={handleSubmit} className="assignment-form">
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
            <label>Due Date</label>
            <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
          </div>
          <button type="submit" className="submit-btn">{editingAssignment ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default AssignmentsPage;