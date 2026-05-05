import { useEffect, useState } from 'react';
import { enrollmentsApi, coursesApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import { departments } from '../../data/departments';
import './EnrollmentsPage.css';

function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [selectedCourse, selectedDepartment]);

  const fetchCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const filters = {
        courseId: selectedCourse === 'all' ? undefined : selectedCourse,
        department: selectedDepartment === 'all' ? undefined : selectedDepartment,
      };
      const data = await enrollmentsApi.getAll(filters);
      setEnrollments(data);
    } catch (error) {
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const openStudentDetails = async (studentId) => {
    setDetailsLoading(true);
    try {
      const data = await enrollmentsApi.getStudent(studentId);
      setSelectedStudent(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const departmentOptions = Array.from(new Set([
    ...departments,
    ...courses.map((course) => course.department).filter(Boolean),
  ]));

  if (loading) return <div className="loading">Loading enrollments...</div>;

  return (
    <div className="enrollments-page">
      <div className="page-header">
        <h2>Student Enrollments</h2>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
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

      <div className="enrollments-list">
        {enrollments.length > 0 ? (
          enrollments.map((enrollment) => (
            <button
              key={enrollment._id}
              type="button"
              className="enrollment-card"
              onClick={() => openStudentDetails(enrollment.student?._id)}
            >
              <div className="enrollment-header">
                <span className="enrollment-name">
                  {[enrollment.student?.firstName, enrollment.student?.lastName].filter(Boolean).join(' ') || 'Unknown Student'}
                </span>
                <span className="enrollment-status">
                  {enrollment.student?.studentStatus || 'active'}
                </span>
              </div>
              <div className="enrollment-meta">
                <span>ID: {enrollment.student?.studentId || 'N/A'}</span>
                <span>Course: {enrollment.course?.name || 'Unknown Course'}</span>
              </div>
              <div className="enrollment-meta">
                <span>Department: {enrollment.course?.department || 'N/A'}</span>
                <span>Type: {enrollment.course?.type || 'core'}</span>
              </div>
            </button>
          ))
        ) : (
          <p className="empty-message">No enrollments found.</p>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title="Student Details"
      >
        {detailsLoading ? (
          <div className="loading">Loading details...</div>
        ) : (
          selectedStudent && (
            <div className="student-detail">
              <p><strong>Name:</strong> {[selectedStudent.student?.firstName, selectedStudent.student?.lastName].filter(Boolean).join(' ')}</p>
              <p><strong>Email:</strong> {selectedStudent.student?.email}</p>
              <p><strong>Student ID:</strong> {selectedStudent.student?.studentId || 'N/A'}</p>
              <p><strong>Department:</strong> {selectedStudent.student?.department || 'N/A'}</p>
              <p><strong>Status:</strong> {selectedStudent.student?.studentStatus || 'active'}</p>
              <div className="student-courses">
                <p><strong>Enrolled Courses</strong></p>
                {selectedStudent.courses?.length ? (
                  <ul>
                    {selectedStudent.courses.map((course) => (
                      <li key={course._id}>{course.name} ({course.code})</li>
                    ))}
                  </ul>
                ) : (
                  <p>No enrolled courses.</p>
                )}
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}

export default EnrollmentsPage;
