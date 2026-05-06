import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { coursesApi, staffApi, enrollmentsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
import { departments } from '../../data/departments';
import './CoursesPage.css';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignCourse, setAssignCourse] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [professors, setProfessors] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department: departments[0] || 'General',
    creditHours: 3,
    type: 'core',
    enrollmentCap: 40,
    registrationStart: '',
    registrationEnd: '',
  });
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user = {} } = useAuth();
  const isAdmin = user.role === 'admin';
  const isStudent = user.role === 'student';
  const mandatoryCourses = isStudent && user.department
    ? courses.filter((course) => course.type === 'core' && course.department === user.department)
    : [];
  const departmentOptions = Array.from(new Set([
    ...departments,
    ...courses.map((course) => course.department).filter(Boolean),
  ]));
  const openFromQuery = new URLSearchParams(location.search).get('new') === '1';

  useEffect(() => {
    fetchCourses();
  }, [selectedDepartment, selectedType]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchProfessors();
  }, [isAdmin]);

  useEffect(() => {
    if (!isStudent) return;
    fetchEnrollments();
  }, [isStudent]);

  useEffect(() => {
    if (!openFromQuery || !isAdmin) return;

    setEditingCourse(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      department: departments[0] || 'General',
      creditHours: 3,
      type: 'core',
      enrollmentCap: 40,
      registrationStart: '',
      registrationEnd: '',
    });
    setShowModal(true);
    navigate('/courses', { replace: true });
  }, [openFromQuery, isAdmin, navigate]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const departmentFilter = selectedDepartment === 'all' ? undefined : selectedDepartment;
      const typeFilter = selectedType === 'all' ? undefined : selectedType;
      const data = await coursesApi.getAll(departmentFilter, typeFilter);
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const data = await enrollmentsApi.getMine();
      setStudentEnrollments(data);
    } catch (error) {
      toast.error('Failed to load enrollments');
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
        type: 'core',
        enrollmentCap: 40,
        registrationStart: '',
        registrationEnd: '',
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
      type: course.type || 'core',
      enrollmentCap: course.enrollmentCap ?? 40,
      registrationStart: course.registrationStart ? course.registrationStart.split('T')[0] : '',
      registrationEnd: course.registrationEnd ? course.registrationEnd.split('T')[0] : '',
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

  const isCourseEnrolled = (courseId) => studentEnrollments.some((enrollment) => {
    const enrolledCourse = enrollment.course?._id || enrollment.course;
    return enrolledCourse === courseId;
  });

  const isRegistrationOpen = (course) => {
    const now = new Date();
    const start = course.registrationStart ? new Date(course.registrationStart) : null;
    const end = course.registrationEnd ? new Date(course.registrationEnd) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const getRegistrationLabel = (course) => {
    const start = course.registrationStart ? new Date(course.registrationStart) : null;
    const end = course.registrationEnd ? new Date(course.registrationEnd) : null;

    if (!start && !end) return 'Open';
    const startLabel = start ? start.toLocaleDateString() : 'Anytime';
    const endLabel = end ? end.toLocaleDateString() : 'No end';
    return `${startLabel} - ${endLabel}`;
  };

  const handleEnroll = async (course) => {
    if (!isStudent) return;
    setEnrollingCourseId(course._id);
    try {
      await enrollmentsApi.create(course._id);
      toast.success('Enrollment confirmed');
      await Promise.all([fetchCourses(), fetchEnrollments()]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setEnrollingCourseId(null);
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
                type: 'core',
                enrollmentCap: 40,
                registrationStart: '',
                registrationEnd: '',
              });
              setShowModal(true);
            }}
          >
            ➕ Add Course
          </button>
        )}
      </div>

      {isStudent && user.department && (
        <div className="mandatory-section">
          <h3>Mandatory Courses ({user.department})</h3>
          {mandatoryCourses.length > 0 ? (
            <ul className="mandatory-list">
              {mandatoryCourses.map((course) => (
                <li key={course._id}>
                  <span className="mandatory-code">{course.code}</span>
                  <span className="mandatory-name">{course.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No mandatory courses found for your department.</p>
          )}
        </div>
      )}

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
        <div className="filter-group">
          <label>Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="core">Core</option>
            <option value="elective">Elective</option>
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
              <div className="course-tags">
                <span className={`course-type ${course.type}`}>{course.type || 'core'}</span>
                {course.type === 'elective' && (
                  <span className="course-capacity">
                    Capacity: {course.enrolledCount ?? 0}/{course.enrollmentCap ?? 0}
                  </span>
                )}
              </div>
              {course.type === 'elective' && (
                <div className="course-registration">
                  <span>Registration:</span>
                  <span>{getRegistrationLabel(course)}</span>
                </div>
              )}
              <div className="course-professor">
                <span>Professor:</span>
                <span>{course.professor || 'Unassigned'}</span>
              </div>
              {isAdmin && (
                <button className="assign-btn" onClick={() => openAssignModal(course)}>
                  Assign Professor
                </button>
              )}
              {isStudent && course.type === 'elective' && (
                <button
                  className="enroll-btn"
                  onClick={() => handleEnroll(course)}
                  disabled={
                    enrollingCourseId === course._id
                    || isCourseEnrolled(course._id)
                    || (course.enrollmentCap !== null && course.enrolledCount >= course.enrollmentCap)
                    || !isRegistrationOpen(course)
                  }
                >
                  {isCourseEnrolled(course._id)
                    ? 'Enrolled'
                    : (course.enrollmentCap !== null && course.enrolledCount >= course.enrollmentCap)
                      ? 'Course Full'
                      : !isRegistrationOpen(course)
                        ? 'Registration Closed'
                        : (enrollingCourseId === course._id ? 'Enrolling...' : 'Enroll')}
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
            <label>Course Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="core">Core</option>
              <option value="elective">Elective</option>
            </select>
          </div>
          {formData.type === 'elective' && (
            <>
              <div className="form-group">
                <label>Maximum Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.enrollmentCap}
                  onChange={(e) => setFormData({ ...formData, enrollmentCap: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Registration Start</label>
                  <input
                    type="date"
                    value={formData.registrationStart}
                    onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Registration End</label>
                  <input
                    type="date"
                    value={formData.registrationEnd}
                    onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
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
