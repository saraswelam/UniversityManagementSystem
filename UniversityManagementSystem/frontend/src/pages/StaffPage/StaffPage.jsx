import { useEffect, useState } from 'react';
import { staffApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './StaffPage.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [createdPassword, setCreatedPassword] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    officeHours: '',
    department: '',
    role: 'professor',
  });
  const toast = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const data = await staffApi.getAll();
      setStaff(data);
    } catch (error) {
      toast.error('Failed to load staff directory');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      officeHours: '',
      department: '',
      role: 'professor',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailPattern.test(formData.email)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      const response = await staffApi.create(formData);
      toast.success('Staff profile created');
      setCreatedPassword(response.tempPassword || '');
      setShowModal(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error(error.message || 'Failed to create staff profile');
    }
  };

  if (loading) return <div className="loading">Loading staff directory...</div>;

  return (
    <div className="staff-page">
      <div className="page-header">
        <h2>Staff Directory</h2>
        <button
          className="add-btn"
          type="button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          ➕ Add Staff
        </button>
      </div>

      {createdPassword && (
        <div className="credentials-banner">
          <div>
            <strong>Temporary password:</strong> {createdPassword}
          </div>
          <button
            type="button"
            className="dismiss-btn"
            onClick={() => setCreatedPassword('')}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="staff-grid">
        {staff.length > 0 ? (
          staff.map((member) => (
            <div key={member.email} className="staff-card">
              <div className="staff-header">
                <span className="staff-role">{member.role}</span>
              </div>
              <h3 className="staff-name">
                {member.firstName} {member.lastName}
              </h3>
              <p className="staff-detail">📧 {member.email}</p>
              {member.phone && <p className="staff-detail">📞 {member.phone}</p>}
              {member.department && <p className="staff-detail">🏫 {member.department}</p>}
              {member.officeHours && (
                <p className="staff-detail">🕒 {member.officeHours}</p>
              )}
            </div>
          ))
        ) : (
          <p className="empty-message">No staff profiles yet</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Staff Profile">
        <form onSubmit={handleSubmit} className="staff-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="professor">Professor</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Computer Science"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+20 100 000 0000"
            />
          </div>
          <div className="form-group">
            <label>Office Hours</label>
            <input
              type="text"
              value={formData.officeHours}
              onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
              placeholder="Mon/Wed 10:00-12:00"
            />
          </div>
          <button type="submit" className="submit-btn">Create Profile</button>
        </form>
      </Modal>
    </div>
  );
}

export default StaffPage;
