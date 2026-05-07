import { useEffect, useMemo, useState } from 'react';
import { assignmentsApi, enrollmentsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import '../StudentDashboard/StudentDashboard.css';

function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [assignmentData, enrollmentData] = await Promise.all([
          assignmentsApi.getAll(),
          enrollmentsApi.getMine(),
        ]);
        setAssignments(assignmentData);
        setEnrollments(enrollmentData);
      } catch (error) {
        toast.error(error.message || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const enrolledCourses = enrollments.map((enrollment) => enrollment.course).filter(Boolean);
  const filteredAssignments = useMemo(() => {
    if (selectedCourse === 'all') return assignments;
    return assignments.filter((assignment) => assignment.courseCode === selectedCourse);
  }, [assignments, selectedCourse]);

  if (loading) return <div className="loading">Loading assignments...</div>;

  return (
    <div className="student-page">
      <section className="student-hero">
        <div>
          <p className="student-kicker">Assignments</p>
          <h2>Work from your enrolled courses</h2>
        </div>
        <select
          className="student-input"
          value={selectedCourse}
          onChange={(event) => setSelectedCourse(event.target.value)}
        >
          <option value="all">All enrolled courses</option>
          {enrolledCourses.map((course) => (
            <option key={course._id} value={course.code}>{course.code} - {course.name}</option>
          ))}
        </select>
      </section>

      <section className="student-panel">
        <div className="student-assignment-list">
          {filteredAssignments.length > 0 ? filteredAssignments.map((assignment) => (
            <article className="student-assignment-row" key={assignment._id}>
              <div>
                <span className="student-course-code">{assignment.courseCode}</span>
                <h4>{assignment.title}</h4>
                <p className="student-description">{assignment.description || 'No description.'}</p>
              </div>
              <span className="student-due-date">
                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
              </span>
            </article>
          )) : (
            <p className="student-empty">No assignments found for your enrolled courses.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default StudentAssignmentsPage;
