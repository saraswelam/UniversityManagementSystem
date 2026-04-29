import { useState, useEffect } from 'react';
import { coursesApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './CoursesPage.css';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const toast = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await coursesApi.update(editingCourse._id, formData);
        toast.success('Course updated successfully');
      } else {
        await coursesApi.create(formData);
        toast.success('Course created successfully');
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData({ name: '', code: '', description: '' });
      fetchCourses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({ name: course.name, code: course.code, description: course.description });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await coursesApi.delete(id);
        toast.success('Course deleted successfully');
        fetchCourses();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="courses-page">
      <div className="page-header">
        <h2>Manage Courses</h2>
        <button className="add-btn" onClick={() => { setEditingCourse(null); setFormData({ name: '', code: '', description: '' }); setShowModal(true); }}>
          ➕ Add Course
        </button>
      </div>

      <div className="courses-grid">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div key={course._id} className="course-card">
              <div className="course-header">
                <span className="course-code">{course.code}</span>
                <div className="course-actions">
                  <button onClick={() => handleEdit(course)}>✏️</button>
                  <button onClick={() => handleDelete(course._id)}>🗑️</button>
                </div>
              </div>
              <h3 className="course-name">{course.name}</h3>
              <p className="course-description">{course.description}</p>
            </div>
          ))
        ) : (
          <p className="empty-message">No courses found. Add your first course!</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCourse ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={handleSubmit} className="course-form">
          <div className="form-group">
            <label>Course Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Course Code</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
          </div>
          <button type="submit" className="submit-btn">{editingCourse ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default CoursesPage;