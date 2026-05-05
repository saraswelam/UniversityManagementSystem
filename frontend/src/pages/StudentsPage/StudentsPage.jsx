import { useEffect, useState } from 'react';
import { studentsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './StudentsPage.css';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'all', label: 'All' },
];

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [updatingId, setUpdatingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentsApi.getAll(statusFilter);
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (studentId, status) => {
    setUpdatingId(studentId);
    try {
      await studentsApi.updateStatus(studentId, status);
      toast.success('Student status updated');
      fetchStudents();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="loading">Loading students...</div>;

  return (
    <div className="students-page">
      <div className="page-header">
        <h2>Student Records</h2>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="students-list">
        {students.length > 0 ? (
          students.map((student) => (
            <div key={student._id} className="student-card">
              <div className="student-header">
                <span className="student-name">
                  {[student.firstName, student.lastName].filter(Boolean).join(' ')}
                </span>
                <span className="student-status">{student.studentStatus || 'active'}</span>
              </div>
              <div className="student-meta">
                <span>ID: {student.studentId || 'N/A'}</span>
                <span>Email: {student.email}</span>
              </div>
              <div className="student-meta">
                <span>Department: {student.department || 'N/A'}</span>
              </div>
              <div className="student-actions">
                <label>Update Status</label>
                <select
                  value={student.studentStatus || 'active'}
                  onChange={(e) => handleStatusChange(student._id, e.target.value)}
                  disabled={updatingId === student._id}
                >
                  {statusOptions.filter((option) => option.value !== 'all').map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">No students found.</p>
        )}
      </div>
    </div>
  );
}

export default StudentsPage;
