import { useState, useEffect } from 'react';
import { leaveRequestsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './LeaveRequestsPage.css';

function LeaveRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'vacation',
    reason: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await leaveRequestsApi.getAll();
      setRequests(data);
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      await leaveRequestsApi.create(formData);
      toast.success('Leave request submitted successfully');
      setShowModal(false);
      setFormData({ startDate: '', endDate: '', leaveType: 'vacation', reason: '' });
      fetchRequests();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await leaveRequestsApi.delete(id);
        toast.success('Leave request deleted successfully');
        fetchRequests();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const openRequestModal = () => {
    setFormData({ startDate: '', endDate: '', leaveType: 'vacation', reason: '' });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading leave requests...</div>;

  return (
    <div className="leave-requests-page">
      <div className="page-header">
        <h2>Leave Requests</h2>
        <button className="add-btn" onClick={openRequestModal}>
          ➕ Request Leave
        </button>
      </div>

      <div className="requests-grid">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div key={request._id} className={`request-card ${request.status}`}>
              <div className="request-header">
                <span className="leave-type">{request.leaveType}</span>
                <span className={`status-badge ${request.status}`}>
                  {request.status}
                </span>
              </div>
              <div className="request-dates">
                {formatDate(request.startDate)} - {formatDate(request.endDate)}
              </div>
              <div className="request-details">
                <p>📅 {calculateDays(request.startDate, request.endDate)} day(s)</p>
                <p>📧 {request.staffEmail}</p>
              </div>
              {request.reason && (
                <div className="request-reason">
                  "{request.reason}"
                </div>
              )}
              {request.status === 'pending' && (
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(request._id)}
                >
                  Delete Request
                </button>
              )}
              {request.reviewNotes && (
                <div className="request-details">
                  <p><strong>Review Notes:</strong> {request.reviewNotes}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="empty-message">No leave requests found. Submit your first request!</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Leave">
        <form onSubmit={handleSubmit} className="leave-form">
          <div className="form-group">
            <label>Leave Type</label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              required
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
              <option value="emergency">Emergency</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="date-range">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <p className="calendar-hint">
            💡 Select dates on the calendar to specify your leave period
          </p>

          <div className="form-group">
            <label>Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows="4"
              placeholder="Please provide a reason for your leave request..."
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Submit Request
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default LeaveRequestsPage;
