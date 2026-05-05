import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { coursesApi, staffApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import { departments } from '../../data/departments';
import './CoursesPage.css';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignCourse, setAssignCourse] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [professors, setProfessors] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department: departments[0] || 'General',
    creditHours: 3,
  });
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const departmentOptions = Array.from(new Set([
    ...departments,
    ...courses.map((course) => course.department).filter(Boolean),
  ]));
  const openFromQuery = new URLSearchParams(location.search).get('new') === '1';

  useEffect(() => {
    fetchCourses();
  }, [selectedDepartment]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchProfessors();
  }, [isAdmin]);

  useEffect(() => {
    if (!openFromQuery || !isAdmin) return;

    setEditingCourse(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      department: departments[0] || 'General',
      creditHours: 3,
    });
    setShowModal(true);
    navigate('/courses', { replace: true });
  }, [openFromQuery, isAdmin, navigate]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const departmentFilter = selectedDepartment === 'all' ? undefined : selectedDepartment;
      const data = await coursesApi.getAll(departmentFilter);
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const data = await staffApi.getAll('professor');
      setProfessors(data);
    } catch (error) {
      toast.error('Failed to load professors');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only admins can manage courses');
      return;
    }

    const payload = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
    };
    try {
      if (editingCourse) {
        await coursesApi.update(editingCourse._id, payload);
        toast.success('Course updated successfully');
      } else {
        await coursesApi.create(payload);
        toast.success('Course created successfully');
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        department: departments[0] || 'General',
        creditHours: 3,
      });
      fetchCourses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (course) => {
    if (!isAdmin) return;
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description,
      department: course.department || departments[0] || 'General',
      creditHours: course.creditHours ?? 3,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('Only admins can manage courses');
      return;
    }
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

  const openAssignModal = (course) => {
    if (!isAdmin) return;
    setAssignCourse(course);
    setSelectedProfessor(course.professor || '');
    setShowAssignModal(true);
  };

  const handleAssignProfessor = async (e) => {
    e.preventDefault();

    if (!assignCourse) return;
    if (!selectedProfessor) {
      toast.error('Please select a professor');
      return;
    }

    setAssigning(true);
    try {
      await coursesApi.assignProfessor(assignCourse._id, selectedProfessor);
      toast.success('Professor assigned successfully');
      setShowAssignModal(false);
      setAssignCourse(null);
      fetchCourses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="courses-page">
      <div className="page-header">
        <h2>Manage Courses</h2>
        {isAdmin && (
          <button
            className="add-btn"
            onClick={() => {
              setEditingCourse(null);
              setFormData({
                name: '',
                code: '',
                description: '',
                department: departments[0] || 'General',
                creditHours: 3,
              });
              setShowModal(true);
            }}
          >
            ➕ Add Course
          </button>
        )}
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
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
                {isAdmin && (
                  <div className="course-actions">
                    <button onClick={() => handleEdit(course)}>✏️</button>
                    <button onClick={() => handleDelete(course._id)}>🗑️</button>
                  </div>
                )}
              </div>
              <h3 className="course-name">{course.name}</h3>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <span className="course-department">{course.department}</span>
                <span className="course-hours">{course.creditHours} credit hours</span>
              </div>
              <div className="course-professor">
                <span>Professor:</span>
                <span>{course.professor || 'Unassigned'}</span>
              </div>
              {isAdmin && (
                <button className="assign-btn" onClick={() => openAssignModal(course)}>
                  Assign Professor
                </button>
              )}
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
            <label>Department</label>
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
          <div className="form-group">
            <label>Credit Hours</label>
            <input
              type="number"
              min="1"
              value={formData.creditHours}
              onChange={(e) => setFormData({ ...formData, creditHours: e.target.value })}
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

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Professor"
      >
        <form onSubmit={handleAssignProfessor} className="course-form">
          <div className="form-group">
            <label>Course</label>
            <input type="text" value={assignCourse?.name || ''} disabled />
          </div>
          <div className="form-group">
            <label>Professor</label>
            <select
              value={selectedProfessor}
              onChange={(e) => setSelectedProfessor(e.target.value)}
              required
            >
              <option value="">Select a professor</option>
              {professors.map((professor) => (
                <option key={professor.email} value={professor.email}>
                  {[professor.firstName, professor.lastName].filter(Boolean).join(' ')} ({professor.email})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-btn" disabled={assigning}>
            {assigning ? 'Assigning...' : 'Assign Professor'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default CoursesPage;