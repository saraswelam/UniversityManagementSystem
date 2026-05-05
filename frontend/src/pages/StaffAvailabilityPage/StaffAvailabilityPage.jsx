import { useEffect, useState } from 'react';
import { staffApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './StaffAvailabilityPage.css';

function StaffAvailabilityPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAvailability();
  }, [date]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const data = await staffApi.getAvailability(date);
      setStaff(data.staff || []);
    } catch (error) {
      toast.error('Failed to load staff availability');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = staff.filter((member) => member.availability === 'active').length;
  const onLeaveCount = staff.filter((member) => member.availability === 'on_leave').length;

  if (loading) return <div className="loading">Loading availability...</div>;

  return (
    <div className="staff-availability-page">
      <div className="page-header">
        <h2>Staff Availability</h2>
        <div className="date-filter">
          <label htmlFor="availability-date">Date</label>
          <input
            id="availability-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="availability-summary">
        <div className="summary-card">
          <span className="summary-label">Active</span>
          <span className="summary-value">{activeCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">On Leave</span>
          <span className="summary-value">{onLeaveCount}</span>
        </div>
      </div>

      <div className="availability-grid">
        {staff.length > 0 ? (
          staff.map((member) => (
            <div key={member._id} className="availability-card">
              <div className="availability-header">
                <span className="availability-name">
                  {[member.firstName, member.lastName].filter(Boolean).join(' ')}
                </span>
                <span className={`availability-status ${member.availability}`}>
                  {member.availability === 'on_leave' ? 'On Leave' : 'Active'}
                </span>
              </div>
              <div className="availability-meta">
                <span>Role: {member.role}</span>
                <span>Department: {member.department || 'N/A'}</span>
              </div>
              <div className="availability-meta">
                <span>Email: {member.email}</span>
                {member.phone && <span>Phone: {member.phone}</span>}
              </div>
              {member.officeHours && (
                <div className="availability-meta">
                  <span>Office Hours: {member.officeHours}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="empty-message">No staff records found.</p>
        )}
      </div>
    </div>
  );
}

export default StaffAvailabilityPage;
