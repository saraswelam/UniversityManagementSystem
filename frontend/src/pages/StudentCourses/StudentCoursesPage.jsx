import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi, enrollmentsApi } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../hooks/useToast';
import '../StudentDashboard/StudentDashboard.css';
import './StudentCourses.css';

function StudentCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState('');
  const { user = {} } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function fetchData() {
    const [courseData, enrollmentData] = await Promise.all([
      coursesApi.getAll(),
      enrollmentsApi.getMine(),
    ]);
    setCourses(courseData);
    setEnrollments(enrollmentData);
  }

  useEffect(() => {
    fetchData()
      .catch((error) => toast.error(error.message || 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const enrolledCourseIds = useMemo(() => new Set(
    enrollments.map((enrollment) => enrollment.course?._id || enrollment.course).filter(Boolean)
  ), [enrollments]);

  const coreCourses = courses.filter((course) => (
    course.type === 'core' && (!user.department || course.department === user.department)
  ));
  const electives = courses.filter((course) => course.type === 'elective');

  const isRegistrationOpen = (course) => {
    const now = new Date();
    const start = course.registrationStart ? new Date(course.registrationStart) : null;
    const end = course.registrationEnd ? new Date(course.registrationEnd) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const handleEnroll = async (course) => {
    setEnrollingId(course._id);
    try {
      await enrollmentsApi.create(course._id);
      toast.success('Enrollment confirmed');
      await fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setEnrollingId('');
    }
  };

  const renderCourse = (course) => {
    const isEnrolled = enrolledCourseIds.has(course._id);
    const isFull = course.enrollmentCap !== null && course.enrolledCount >= course.enrollmentCap;
    const registrationOpen = isRegistrationOpen(course);

    return (
      <article className="student-catalog-card" key={course._id}>
        <button className="student-card-main" type="button" onClick={() => navigate(`/courses/${course._id}`)}>
          <span className="student-course-code">{course.code}</span>
          <h3>{course.name}</h3>
          <p>{course.description || 'No description added yet.'}</p>
          <div className="student-card-meta">
            <span>{course.department}</span>
            <span>{course.creditHours} credits</span>
            <span>{course.professor || 'Professor TBA'}</span>
          </div>
        </button>
        <button
          className="student-secondary-btn"
          type="button"
          disabled={isEnrolled || isFull || !registrationOpen || enrollingId === course._id}
          onClick={() => handleEnroll(course)}
        >
          {isEnrolled
            ? 'Registered'
            : isFull
              ? 'Full'
              : !registrationOpen
                ? 'Closed'
                : enrollingId === course._id
                  ? 'Registering...'
                  : 'Register course'}
        </button>
      </article>
    );
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="student-page">
      <section className="student-hero">
        <div>
          <p className="student-kicker">Courses</p>
          <h2>Core subjects and available electives</h2>
        </div>
      </section>

      <section className="student-panel">
        <div className="student-panel-header">
          <h3>Core Subjects{user.department ? ` - ${user.department}` : ''}</h3>
        </div>
        <div className="student-catalog-grid">
          {coreCourses.length > 0
            ? coreCourses.map((course) => renderCourse(course))
            : <p className="student-empty">No core subjects listed for your department.</p>}
        </div>
      </section>

      <section className="student-panel">
        <div className="student-panel-header">
          <h3>Available Electives</h3>
        </div>
        <div className="student-catalog-grid">
          {electives.length > 0
            ? electives.map((course) => renderCourse(course))
            : <p className="student-empty">No electives are available yet.</p>}
        </div>
      </section>
    </div>
  );
}

export default StudentCoursesPage;
