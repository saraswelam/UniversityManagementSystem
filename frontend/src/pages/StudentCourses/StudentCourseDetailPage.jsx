import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { assignmentsApi, coursesApi, officeHoursApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import '../StudentDashboard/StudentDashboard.css';
import './StudentCourses.css';

function StudentCourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [officeHours, setOfficeHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const courseData = await coursesApi.getById(id);
        const [assignmentData, officeHourData] = await Promise.all([
          assignmentsApi.getAll(courseData.code),
          courseData.professor ? officeHoursApi.getAll(courseData.professor) : Promise.resolve([]),
        ]);
        setCourse(courseData);
        setAssignments(assignmentData);
        setOfficeHours(officeHourData);
      } catch (error) {
        toast.error(error.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) return <div className="loading">Loading course...</div>;
  if (!course) return <p className="student-empty">Course not found.</p>;

  return (
    <div className="student-page">
      <section className="student-hero">
        <div>
          <p className="student-kicker">{course.code}</p>
          <h2>{course.name}</h2>
        </div>
        <Link className="student-primary-link" to="/courses">Back to courses</Link>
      </section>

      <div className="student-dashboard-grid">
        <section className="student-panel">
          <div className="student-panel-header">
            <h3>Details</h3>
          </div>
          <dl className="student-detail-list">
            <div><dt>Department</dt><dd>{course.department}</dd></div>
            <div><dt>Type</dt><dd>{course.type || 'core'}</dd></div>
            <div><dt>Credit hours</dt><dd>{course.creditHours}</dd></div>
            <div><dt>Professor</dt><dd>{course.professor || 'Unassigned'}</dd></div>
          </dl>
          <p className="student-description">{course.description || 'No description added yet.'}</p>
        </section>

        <section className="student-panel">
          <div className="student-panel-header">
            <h3>Professor Office Hours</h3>
          </div>
          <div className="office-hour-list">
            {officeHours.length > 0 ? officeHours.map((item) => (
              <div className="office-hour-row" key={item._id}>
                <span>{item.day}</span>
                <strong>{item.startTime} - {item.endTime}</strong>
                <span>{item.location || item.mode || 'TBD'}</span>
              </div>
            )) : (
              <p className="student-empty">No office hours found for this professor.</p>
            )}
          </div>
        </section>
      </div>

      <section className="student-panel">
        <div className="student-panel-header">
          <h3>Assignments</h3>
        </div>
        <div className="student-assignment-list">
          {assignments.length > 0 ? assignments.map((assignment) => (
            <div className="student-assignment-row" key={assignment._id}>
              <div>
                <span className="student-course-code">{assignment.courseCode}</span>
                <h4>{assignment.title}</h4>
                <p className="student-description">{assignment.description || 'No description.'}</p>
              </div>
              <span className="student-due-date">
                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
              </span>
            </div>
          )) : (
            <p className="student-empty">No assignments for this course yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default StudentCourseDetailPage;
