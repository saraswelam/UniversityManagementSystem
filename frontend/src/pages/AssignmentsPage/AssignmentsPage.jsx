import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assignmentsApi, coursesApi } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './AssignmentsPage.css';

const emptyAssignmentForm = { title: '', description: '', dueDate: '', courseId: '' };
const emptySubmissionForm = { content: '' };

function saveBlob({ blob, filename }) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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

function AssignmentsPage() {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const canManageAssignments = role === 'professor';
  const isStudent = role === 'student';

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState(emptyAssignmentForm);
  const [submissionForm, setSubmissionForm] = useState(emptySubmissionForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [gradeDrafts, setGradeDrafts] = useState({});
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const openFromQuery = new URLSearchParams(location.search).get('new') === '1';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!openFromQuery || !canManageAssignments) return;

    setEditingAssignment(null);
    setFormData(emptyAssignmentForm);
    setShowModal(true);
    navigate('/assignments', { replace: true });
  }, [openFromQuery, canManageAssignments, navigate]);

  const submissionsByAssignment = useMemo(() => {
    return submissions.reduce((groups, submission) => {
      const assignmentId = submission.assignmentId?._id || submission.assignmentId;
      return {
        ...groups,
        [assignmentId]: [...(groups[assignmentId] || []), submission],
      };
    }, {});
  }, [submissions]);

  const fetchData = async () => {
    try {
      const [assignmentsData, coursesData, submissionsData] = await Promise.all([
        assignmentsApi.getAll(),
        coursesApi.getAll(),
        assignmentsApi.getSubmissions(),
      ]);

      setAssignments(assignmentsData);
      setCourses(coursesData);
      setSubmissions(submissionsData);
      setGradeDrafts(submissionsData.reduce((drafts, submission) => ({
        ...drafts,
        [submission._id]: {
          grade: submission.grade ?? '',
          feedback: submission.feedback || '',
        },
      }), {}));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await assignmentsApi.update(editingAssignment._id, formData);
        toast.success('Assignment updated');
      } else {
        await assignmentsApi.create(formData);
        toast.success('Assignment created');
      }
      setShowModal(false);
      setEditingAssignment(null);
      setFormData(emptyAssignmentForm);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();

    if (!submissionForm.content.trim() && !selectedFile) {
      toast.error('Add notes or attach a file before submitting');
      return;
    }

    try {
      const fileData = await readFileAsDataUrl(selectedFile);
      await assignmentsApi.submit({
        assignmentId: selectedAssignment._id,
        content: submissionForm.content.trim(),
        fileName: selectedFile?.name || '',
        fileType: selectedFile?.type || '',
        fileData,
      });
      toast.success('Submission saved');
      setShowSubmissionModal(false);
      setSelectedAssignment(null);
      setSubmissionForm(emptySubmissionForm);
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleGradeChange = (submissionId, field, value) => {
    setGradeDrafts((current) => ({
      ...current,
      [submissionId]: {
        ...(current[submissionId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveGrade = async (submissionId) => {
    const draft = gradeDrafts[submissionId] || {};
    const numericGrade = Number(draft.grade);

    if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      toast.error('Grade must be a number from 0 to 100');
      return;
    }

    try {
      const result = await assignmentsApi.gradeSubmission(submissionId, {
        grade: numericGrade,
        feedback: draft.feedback || '',
      });
      const updatedSubmission = result.submission || result;
      setSubmissions((current) => current.map((submission) => (
        submission._id === submissionId ? updatedSubmission : submission
      )));
      toast.success('Grade saved to gradebook');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.split('T')[0] || '',
      courseId: assignment.courseId?._id || assignment.courseId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this assignment?')) {
      try {
        await assignmentsApi.delete(id);
        toast.success('Assignment deleted');
        fetchData();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const openSubmissionModal = (assignment) => {
    const existingSubmission = submissionsByAssignment[assignment._id]?.[0];
    setSelectedAssignment(assignment);
    setSubmissionForm({ content: existingSubmission?.content || '' });
    setSelectedFile(null);
    setShowSubmissionModal(true);
  };

  const downloadSubmission = async (submissionId) => {
    try {
      saveBlob(await assignmentsApi.downloadSubmission(submissionId));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const downloadAllSubmissions = async (assignmentSubmissions) => {
    try {
      for (const submission of assignmentSubmissions) {
        saveBlob(await assignmentsApi.downloadSubmission(submission._id));
      }
      toast.success('Submission downloads started');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId || c._id === courseId?._id);
    return course?.name || courseId?.name || 'No Course';
  };

  if (loading) return <div className="loading">Loading assignments...</div>;

  return (
    <div className="assignments-page">
      <div className="page-header">
        <h2>Assignments</h2>
        {canManageAssignments && (
          <button
            className="add-btn"
            onClick={() => {
              setEditingAssignment(null);
              setFormData(emptyAssignmentForm);
              setShowModal(true);
            }}
          >
            Add Assignment
          </button>
        )}
      </div>

      <div className="assignments-list">
        {assignments.length > 0 ? (
          assignments.map((assignment) => {
            const assignmentSubmissions = submissionsByAssignment[assignment._id] || [];
            const mySubmission = isStudent ? assignmentSubmissions[0] : null;

            return (
              <div key={assignment._id} className="assignment-card">
                <div className="assignment-header">
                  <span className="assignment-course">{getCourseName(assignment.courseId)}</span>
                  {canManageAssignments && (
                    <div className="assignment-actions">
                      <button type="button" onClick={() => handleEdit(assignment)} aria-label="Edit assignment">Edit</button>
                      <button type="button" onClick={() => handleDelete(assignment._id)} aria-label="Delete assignment">Delete</button>
                    </div>
                  )}
                </div>

                <h3 className="assignment-title">{assignment.title}</h3>
                <p className="assignment-description">{assignment.description}</p>

                <div className="assignment-footer">
                  <span className="due-date">
                    Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                </div>

                {isStudent && (
                  <div className="student-submission-panel">
                    <div>
                      <strong>{mySubmission ? 'Submitted' : 'Not submitted yet'}</strong>
                      {mySubmission && (
                        <span>
                          Grade: {mySubmission.grade ?? 'Pending'}
                          {mySubmission.feedback ? ` - ${mySubmission.feedback}` : ''}
                        </span>
                      )}
                    </div>
                    <button type="button" className="secondary-btn" onClick={() => openSubmissionModal(assignment)}>
                      {mySubmission ? 'Update Submission' : 'Submit Work'}
                    </button>
                  </div>
                )}

                {canManageAssignments && (
                  <div className="submissions-panel">
                    <div className="submissions-header">
                      <h4>Student submissions</h4>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => downloadAllSubmissions(assignmentSubmissions)}
                        disabled={assignmentSubmissions.length === 0}
                      >
                        Download All
                      </button>
                    </div>

                    {assignmentSubmissions.length > 0 ? (
                      <div className="submissions-table">
                        {assignmentSubmissions.map((submission) => {
                          const draft = gradeDrafts[submission._id] || {};

                          return (
                            <div key={submission._id} className="submission-row">
                              <div className="submission-student">
                                <strong>{submission.studentName}</strong>
                                <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                                <span>{submission.fileName || 'Text submission'}</span>
                              </div>
                              <button type="button" className="secondary-btn" onClick={() => downloadSubmission(submission._id)}>
                                Download
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={draft.grade}
                                onChange={(e) => handleGradeChange(submission._id, 'grade', e.target.value)}
                                placeholder="0-100"
                                aria-label={`Grade for ${submission.studentName}`}
                              />
                              <input
                                type="text"
                                value={draft.feedback}
                                onChange={(e) => handleGradeChange(submission._id, 'feedback', e.target.value)}
                                placeholder="Feedback"
                                aria-label={`Feedback for ${submission.studentName}`}
                              />
                              <button type="button" className="submit-btn compact" onClick={() => handleSaveGrade(submission._id)}>
                                Save Grade
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="empty-submissions">No students have submitted yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="empty-message">No assignments yet</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAssignment ? 'Edit Assignment' : 'Add Assignment'}>
        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Course</label>
            <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} required>
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" />
          </div>
          <button type="submit" className="submit-btn">{editingAssignment ? 'Update' : 'Create'}</button>
        </form>
      </Modal>

      <Modal isOpen={showSubmissionModal} onClose={() => setShowSubmissionModal(false)} title={`Submit: ${selectedAssignment?.title || ''}`}>
        <form onSubmit={handleSubmissionSubmit} className="assignment-form">
          <div className="form-group">
            <label>Notes</label>
            <textarea value={submissionForm.content} onChange={(e) => setSubmissionForm({ content: e.target.value })} rows="4" />
          </div>
          <div className="form-group">
            <label>File</label>
            <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
          </div>
          <button type="submit" className="submit-btn">Save Submission</button>
        </form>
      </Modal>
    </div>
  );
}

export default AssignmentsPage;
