import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assignmentsApi, enrollmentsApi, meetingsApi, officeHoursApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './StudentDashboard.css';

function getCourse(enrollment) {
  return enrollment.course || enrollment;
}

function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [officeHours, setOfficeHours] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [booking, setBooking] = useState({
    date: '',
    time: '',
    mode: 'In person',
    title: 'Academic support meeting',
  });
  const [loading, setLoading] = useState(true);
  const [bookingProfessor, setBookingProfessor] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [enrollmentData, assignmentData, officeHourData] = await Promise.all([
          enrollmentsApi.getMine(),
          assignmentsApi.getAll(),
          officeHoursApi.getAll(),
        ]);
        setEnrollments(enrollmentData);
        setAssignments(assignmentData);
        setOfficeHours(officeHourData);
      } catch (error) {
        toast.error(error.message || 'Failed to load student dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const professors = useMemo(() => {
    const names = enrollments
      .map((enrollment) => getCourse(enrollment)?.professor)
      .filter((professor) => professor && professor !== 'General');
    return Array.from(new Set(names)).sort();
  }, [enrollments]);

  useEffect(() => {
    if (!selectedProfessor && professors.length > 0) {
      setSelectedProfessor(professors[0]);
    }
  }, [professors, selectedProfessor]);

  const visibleOfficeHours = selectedProfessor
    ? officeHours.filter((item) => item.professor === selectedProfessor)
    : [];

  const upcomingAssignments = assignments.slice(0, 4);
  const takenCourses = useMemo(() => {
    const coursesById = new Map();

    enrollments.forEach((enrollment) => {
      const course = getCourse(enrollment);
      if (course?._id) coursesById.set(course._id, course);
    });

    return Array.from(coursesById.values());
  }, [enrollments]);

  const handleBookMeeting = async (event) => {
    event.preventDefault();
    const professor = bookingProfessor || selectedProfessor;

    if (!professor) {
      toast.error('Choose a professor first');
      return;
    }

    try {
      await meetingsApi.create({
        ...booking,
        professor,
      });
      toast.success('Meeting booked for 15 minutes');
      setBooking({
        date: '',
        time: '',
        mode: 'In person',
        title: 'Academic support meeting',
      });
      setBookingProfessor('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="loading">Loading student dashboard...</div>;

  return (
    <div className="student-page">
      <section className="student-hero">
        <div>
          <p className="student-kicker">Student dashboard</p>
          <h2>Your courses and support</h2>
        </div>
        <button className="student-primary-btn" type="button" onClick={() => navigate('/courses')}>
          View available courses
        </button>
      </section>

      <div className="student-summary-grid">
        <div className="student-summary-card">
          <span className="student-summary-value">{takenCourses.length}</span>
          <span className="student-summary-label">Taken courses</span>
        </div>
        <div className="student-summary-card">
          <span className="student-summary-value">{assignments.length}</span>
          <span className="student-summary-label">Assignments</span>
        </div>
        <div className="student-summary-card">
          <span className="student-summary-value">{professors.length}</span>
          <span className="student-summary-label">Professors with office hours</span>
        </div>
      </div>

      <div className="student-dashboard-grid">
        <section className="student-panel">
          <div className="student-panel-header">
            <h3>Taken Courses</h3>
            <Link to="/courses">Browse courses</Link>
          </div>
          <div className="student-course-list">
            {takenCourses.length > 0 ? takenCourses.map((course) => {
              return (
                <button
                  className="student-course-row"
                  key={course._id}
                  type="button"
                  onClick={() => navigate(`/courses/${course._id}`)}
                >
                  <span className="student-course-code">{course.code}</span>
                  <span className="student-course-name">{course.name}</span>
                  <span className="student-course-meta">{course.type || 'course'}</span>
                </button>
              );
            }) : (
              <p className="student-empty">No enrolled courses yet.</p>
            )}
          </div>
        </section>

        <section className="student-panel">
          <div className="student-panel-header">
            <h3>Upcoming Assignments</h3>
            <Link to="/assignments">View all</Link>
          </div>
          <div className="student-assignment-list">
            {upcomingAssignments.length > 0 ? upcomingAssignments.map((assignment) => (
              <div className="student-assignment-row" key={assignment._id}>
                <div>
                  <span className="student-course-code">{assignment.courseCode}</span>
                  <h4>{assignment.title}</h4>
                </div>
                <span className="student-due-date">
                  {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                </span>
              </div>
            )) : (
              <p className="student-empty">No assignments for your enrolled courses.</p>
            )}
          </div>
        </section>
      </div>

      <section className="student-panel support-panel">
        <div className="student-panel-header">
          <h3>Office Hours and Meetings</h3>
          <Link to="/schedule">View schedule</Link>
        </div>
        <div className="support-grid">
          <div>
            <label className="student-label" htmlFor="professor-select">Professor</label>
            <select
              id="professor-select"
              className="student-input"
              value={selectedProfessor}
              onChange={(event) => setSelectedProfessor(event.target.value)}
              disabled={professors.length === 0}
            >
              {professors.length === 0 && (
                <option value="">No course professors yet</option>
              )}
              {professors.map((professor) => (
                <option key={professor} value={professor}>{professor}</option>
              ))}
            </select>

            <div className="office-hour-list">
              {visibleOfficeHours.length > 0 ? visibleOfficeHours.map((item) => (
                <button
                  key={item._id}
                  className="office-hour-row"
                  type="button"
                  onClick={() => setBookingProfessor(item.professor)}
                >
                  <span>{item.day}</span>
                  <strong>{item.startTime} - {item.endTime}</strong>
                  <span>{item.location || item.mode || 'TBD'}</span>
                </button>
              )) : (
                <p className="student-empty">
                  {professors.length === 0
                    ? 'Register courses with assigned professors to see office hours.'
                    : 'No office hours listed for this professor yet.'}
                </p>
              )}
            </div>
          </div>

          <form className="booking-form" onSubmit={handleBookMeeting}>
            <label className="student-label" htmlFor="meeting-title">Meeting title</label>
            <input
              id="meeting-title"
              className="student-input"
              value={booking.title}
              onChange={(event) => setBooking({ ...booking, title: event.target.value })}
              required
            />
            <div className="student-form-row">
              <div>
                <label className="student-label" htmlFor="meeting-date">Date</label>
                <input
                  id="meeting-date"
                  className="student-input"
                  type="date"
                  value={booking.date}
                  onChange={(event) => setBooking({ ...booking, date: event.target.value })}
                  required
                />
              </div>
              <div>
                <label className="student-label" htmlFor="meeting-time">Time</label>
                <input
                  id="meeting-time"
                  className="student-input"
                  type="time"
                  value={booking.time}
                  onChange={(event) => setBooking({ ...booking, time: event.target.value })}
                  required
                />
              </div>
            </div>
            <label className="student-label" htmlFor="meeting-mode">Mode</label>
            <select
              id="meeting-mode"
              className="student-input"
              value={booking.mode}
              onChange={(event) => setBooking({ ...booking, mode: event.target.value })}
            >
              <option value="In person">In person</option>
              <option value="Virtual">Virtual</option>
            </select>
            <button className="student-primary-btn" type="submit">Book 15 min meeting</button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default StudentDashboard;
