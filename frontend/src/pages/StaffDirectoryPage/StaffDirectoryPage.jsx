import { useEffect, useState } from 'react';
import { staffApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './StaffDirectoryPage.css';

function StaffDirectoryPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    officeHours: '',
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

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      await staffApi.create({
        ...formData,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        officeHours: formData.officeHours.trim(),
      });
      toast.success('Staff profile created successfully');
      setShowModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        officeHours: '',
        role: 'professor',
      });
      fetchStaff();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="loading">Loading staff directory...</div>;

  return (
    <div className="staff-directory-page">
      <div className="page-header">
        <h2>Staff Directory</h2>
        <button
          className="add-btn"
          onClick={() => {
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              officeHours: '',
              role: 'professor',
            });
            setShowModal(true);
          }}
        >
          ➕ Add Staff Profile
        </button>
      </div>

      <div className="staff-grid">
        {staff.length > 0 ? (
          staff.map((member) => (
            <div key={member._id || member.id} className="staff-card">
              <div className="staff-header">
                <span className="staff-role">{member.role}</span>
              </div>
              <h3 className="staff-name">
                {[member.firstName, member.lastName].filter(Boolean).join(' ')}
              </h3>
              <p className="staff-detail">📧 {member.email}</p>
              {member.phone && <p className="staff-detail">📞 {member.phone}</p>}
              {member.officeHours && (
                <p className="staff-detail">🕒 {member.officeHours}</p>
              )}
            </div>
          ))
        ) : (
          <p className="empty-message">No staff profiles found.</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Staff Profile">
        <form onSubmit={handleSubmit} className="staff-form">
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
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Office Hours</label>
            <input
              type="text"
              value={formData.officeHours}
              onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
              placeholder="Mon/Wed 2-4pm"
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="professor">Professor</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <button type="submit" className="submit-btn">Create Profile</button>
        </form>
      </Modal>
    </div>
  );
}

export default StaffDirectoryPage;
