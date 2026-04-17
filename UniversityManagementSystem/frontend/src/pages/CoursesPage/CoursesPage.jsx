import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { coursesApi, staffApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './CoursesPage.css';

const defaultDepartments = [
  'General',
  'Administration',
  'Computer Science',
  'Engineering',
  'Business',
  'Arts',
  'Science',
  'Registrar',
];

function CoursesPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department: 'General',
    creditHours: 3,
    professor: '',
  });
  const toast = useToast();

  const fetchCourses = async (selectedDepartment = departmentFilter) => {
    setLoading(true);
    try {
      const filters = selectedDepartment !== 'all' ? { department: selectedDepartment } : {};
      const data = await coursesApi.getAll(filters);
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const departmentOptions = Array.from(
    new Set([
      ...defaultDepartments,
      ...courses.map((course) => course.department).filter(Boolean),
      formData.department,
    ])
  ).filter(Boolean);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      department: departmentOptions[0] || 'General',
      creditHours: 3,
      professor: '',
    });
  };

  useEffect(() => {
    fetchCourses();
  }, [departmentFilter]);

  useEffect(() => {
    const fetchProfessors = async () => {
      if (!isAdmin) return;
      try {
        const data = await staffApi.getAll({ role: 'professor' });
        setProfessors(data);
      } catch (error) {
        toast.error('Failed to load staff directory');
      }
    };

    fetchProfessors();
  }, [isAdmin, toast]);

  useEffect(() => {
    if (location.state?.openAdd) {
      setEditingCourse(null);
      resetForm();
      setShowModal(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

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
      resetForm();
      fetchCourses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description,
      department: course.department || 'General',
      creditHours: course.creditHours || 3,
      professor: course.professor || '',
    });
    setShowModal(true);
  };

  const getProfessorName = (email) => {
    if (!email) return 'Unassigned';
    const professor = professors.find((entry) => entry.email === email);
    if (!professor) return email;
    return `${professor.firstName} ${professor.lastName}`.trim();
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
        <button
          className="add-btn"
          type="button"
          onClick={() => {
            setEditingCourse(null);
            resetForm();
            setShowModal(true);
          }}
        >
          ➕ Add Course
        </button>
      </div>

      <div className="page-toolbar">
        <div className="filter-group">
          <label htmlFor="departmentFilter">Department / Program</label>
          <select
            id="departmentFilter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>
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
              <p className="course-meta">
                {course.department || 'General'} • {course.creditHours || 3} credit hours
              </p>
              <p className="course-instructor">
                Instructor: {getProfessorName(course.professor)}
              </p>
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
            <label>Department / Program</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            >
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div className="form-group">
              <label>Assign Professor</label>
              <select
                value={formData.professor}
                onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
              >
                <option value="">Unassigned</option>
                {professors.map((professor) => (
                  <option key={professor.email} value={professor.email}>
                    {professor.firstName} {professor.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Credit Hours</label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.creditHours}
              onChange={(e) => setFormData({ ...formData, creditHours: Number(e.target.value) })}
              required
            />
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