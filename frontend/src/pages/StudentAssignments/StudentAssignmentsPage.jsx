import { useEffect, useMemo, useState } from 'react';
import { assignmentsApi, enrollmentsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import '../StudentDashboard/StudentDashboard.css';

const emptySubmissionForm = { content: '' };

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });
}

function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionForm, setSubmissionForm] = useState(emptySubmissionForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [assignmentData, enrollmentData, submissionData] = await Promise.all([
        assignmentsApi.getAll(),
        enrollmentsApi.getMine(),
        assignmentsApi.getSubmissions(),
      ]);
      setAssignments(assignmentData);
      setEnrollments(enrollmentData);
      setSubmissions(submissionData);
    } catch (error) {
      toast.error(error.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enrolledCourses = enrollments.map((enrollment) => enrollment.course).filter(Boolean);
  const submissionsByAssignment = useMemo(() => {
    return submissions.reduce((groups, submission) => {
      const assignmentId = submission.assignmentId?._id || submission.assignmentId;
      return {
        ...groups,
        [assignmentId]: submission,
      };
    }, {});
  }, [submissions]);

  const filteredAssignments = useMemo(() => {
    if (selectedCourse === 'all') return assignments;
    return assignments.filter((assignment) => assignment.courseCode === selectedCourse);
  }, [assignments, selectedCourse]);

  const openSubmissionModal = (assignment) => {
    const existingSubmission = submissionsByAssignment[assignment._id];
    setSelectedAssignment(assignment);
    setSubmissionForm({ content: existingSubmission?.content || '' });
    setSelectedFile(null);
    setShowSubmissionModal(true);
  };

  const handleSubmissionSubmit = async (event) => {
    event.preventDefault();

    if (!selectedAssignment) return;
    if (!submissionForm.content.trim() && !selectedFile) {
      toast.error('Add notes or attach a file before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const fileData = await readFileAsDataUrl(selectedFile);
      await assignmentsApi.submit({
        assignmentId: selectedAssignment._id,
        content: submissionForm.content.trim(),
        fileName: selectedFile?.name || '',
        fileType: selectedFile?.type || '',
        fileData,
      });

      toast.success('Assignment submitted');
      setShowSubmissionModal(false);
      setSelectedAssignment(null);
      setSubmissionForm(emptySubmissionForm);
      setSelectedFile(null);
      await fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

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
          {filteredAssignments.length > 0 ? filteredAssignments.map((assignment) => {
            const submission = submissionsByAssignment[assignment._id];

            return (
              <article className="student-assignment-row student-assignment-row-expanded" key={assignment._id}>
                <div>
                  <span className="student-course-code">{assignment.courseCode}</span>
                  <h4>{assignment.title}</h4>
                  <p className="student-description">{assignment.description || 'No description.'}</p>
                  <div className="student-submission-status">
                    <strong>{submission ? 'Submitted' : 'Not submitted yet'}</strong>
                    {submission && (
                      <span>
                        Grade: {submission.grade ?? 'Pending'}
                        {submission.feedback ? ` - ${submission.feedback}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="student-assignment-actions">
                  <span className="student-due-date">
                    {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                  <button
                    type="button"
                    className="student-primary-btn"
                    onClick={() => openSubmissionModal(assignment)}
                  >
                    {submission ? 'Update Submission' : 'Submit Assignment'}
                  </button>
                </div>
              </article>
            );
          }) : (
            <p className="student-empty">No assignments found for your enrolled courses.</p>
          )}
        </div>
      </section>

      <Modal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        title={`Submit: ${selectedAssignment?.title || ''}`}
      >
        <form onSubmit={handleSubmissionSubmit} className="student-submission-form">
          <label>
            Notes
            <textarea
              value={submissionForm.content}
              onChange={(event) => setSubmissionForm({ content: event.target.value })}
              rows="4"
              placeholder="Write your answer or add notes about the attached file"
            />
          </label>
          <label>
            File
            <input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          </label>
          <button type="submit" className="student-primary-btn" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Save Submission'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default StudentAssignmentsPage;
