import { useState, useEffect } from 'react';
import { classroomsApi, roomBookingsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './RoomBookingsPage.css';

function RoomBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [classroomForm, setClassroomForm] = useState({
    roomNumber: '',
    roomName: '',
    maxCapacity: 10,
    equipment: '',
  });
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    roomNumber: '',
    roomName: '',
    purpose: '',
  });
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const toast = useToast();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsData, classroomsData] = await Promise.all([
        roomBookingsApi.getAll(),
        classroomsApi.getAll(),
      ]);
      setBookings(bookingsData);
      setClassrooms(classroomsData);
    } catch (error) {
      toast.error('Failed to load room data');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!formData.date || !formData.startTime) {
      toast.error('Please select date and time first');
      return;
    }

    setCheckingAvailability(true);
    try {
      const rooms = await roomBookingsApi.getAvailable(formData.date, formData.startTime);
      setAvailableRooms(rooms);
      if (rooms.length === 0) {
        toast.error('No rooms available for the selected time');
      }
    } catch (error) {
      toast.error('Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.roomNumber || !formData.roomName) {
      toast.error('Please select a room');
      return;
    }

    try {
      await roomBookingsApi.create(formData);
      toast.success('Room booked successfully');
      setShowModal(false);
      setFormData({ date: '', startTime: '', roomNumber: '', roomName: '', purpose: '' });
      setAvailableRooms([]);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    const equipment = classroomForm.equipment
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await classroomsApi.create({
        roomNumber: classroomForm.roomNumber,
        roomName: classroomForm.roomName,
        maxCapacity: classroomForm.maxCapacity,
        equipment,
      });
      toast.success('Classroom created');
      setShowClassroomModal(false);
      setClassroomForm({ roomNumber: '', roomName: '', maxCapacity: 10, equipment: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to create classroom');
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await roomBookingsApi.cancel(id);
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const selectRoom = (room) => {
    setFormData({
      ...formData,
      roomNumber: room.roomNumber,
      roomName: room.roomName,
    });
  };

  const openBookingModal = () => {
    setFormData({ date: '', startTime: '', roomNumber: '', roomName: '', purpose: '' });
    setAvailableRooms([]);
    setShowModal(true);
  };

  const openClassroomModal = () => {
    setClassroomForm({ roomNumber: '', roomName: '', maxCapacity: 10, equipment: '' });
    setShowClassroomModal(true);
  };

  if (loading) return <div className="loading">Loading bookings...</div>;

  return (
    <div className="room-bookings-page">
      <div className="page-header">
        <h2>Room Bookings</h2>
        <div className="header-actions">
          {isAdmin && (
            <button className="secondary-btn" type="button" onClick={openClassroomModal}>
              ➕ Define Classroom
            </button>
          )}
          <button className="add-btn" type="button" onClick={openBookingModal}>
            ➕ Book a Room
          </button>
        </div>
      </div>

      <section className="classroom-section">
        <div className="section-header">
          <h3>Classroom Directory</h3>
          <span>{classrooms.length} rooms</span>
        </div>
        <div className="classroom-grid">
          {classrooms.length > 0 ? (
            classrooms.map((room) => (
              <div key={room._id} className="classroom-card">
                <div className="classroom-header">
                  <span className="classroom-number">{room.roomNumber}</span>
                  <span className="classroom-capacity">Max {room.maxCapacity}</span>
                </div>
                <h4 className="classroom-name">{room.roomName}</h4>
                <div className="classroom-equipment">
                  {(room.equipment || []).length > 0 ? (
                    room.equipment.map((item) => (
                      <span key={item} className="equipment-chip">{item}</span>
                    ))
                  ) : (
                    <span className="equipment-chip muted">No equipment listed</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="empty-message">No classrooms defined yet</p>
          )}
        </div>
      </section>

      <div className="bookings-grid">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking._id} className={`booking-card ${booking.status}`}>
              <div className="booking-header">
                <span className="room-number">{booking.roomNumber}</span>
                <span className={`status-badge ${booking.status}`}>
                  {booking.status}
                </span>
              </div>
              <h3 className="room-name">{booking.roomName}</h3>
              <div className="booking-details">
                <p>📅 {booking.date}</p>
                <p>🕐 {booking.startTime} - {booking.endTime}</p>
                {booking.purpose && <p>📝 {booking.purpose}</p>}
              </div>
              {booking.status === 'active' && (
                <button 
                  className="cancel-btn" 
                  onClick={() => handleCancel(booking._id)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="empty-message">No bookings found. Book your first room!</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Book a Room">
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
            <small>Session duration: 1 hour</small>
          </div>

          <button
            type="button"
            className="check-btn"
            onClick={checkAvailability}
            disabled={checkingAvailability}
          >
            {checkingAvailability ? 'Checking...' : 'Check Availability'}
          </button>

          {availableRooms.length > 0 && (
            <div className="available-rooms">
              <label>Available Rooms</label>
              <div className="rooms-list">
                {availableRooms.map((room) => (
                  <div
                    key={room.roomNumber}
                    className={`room-option ${formData.roomNumber === room.roomNumber ? 'selected' : ''}`}
                    onClick={() => selectRoom(room)}
                  >
                    <strong>{room.roomNumber}</strong> - {room.roomName}
                    <small>Capacity: {room.capacity}</small>
                    {room.equipment?.length > 0 && (
                      <small>Equipment: {room.equipment.join(', ')}</small>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Purpose (Optional)</label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows="3"
              placeholder="Meeting, training, etc."
            />
          </div>

          <button type="submit" className="submit-btn" disabled={!formData.roomNumber}>
            Book Room
          </button>
        </form>
      </Modal>

      <Modal isOpen={showClassroomModal} onClose={() => setShowClassroomModal(false)} title="Define Classroom">
        <form onSubmit={handleCreateClassroom} className="booking-form">
          <div className="form-group">
            <label>Room Number</label>
            <input
              type="text"
              value={classroomForm.roomNumber}
              onChange={(e) => setClassroomForm({ ...classroomForm, roomNumber: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Room Name</label>
            <input
              type="text"
              value={classroomForm.roomName}
              onChange={(e) => setClassroomForm({ ...classroomForm, roomName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Max Capacity</label>
            <input
              type="number"
              min="1"
              value={classroomForm.maxCapacity}
              onChange={(e) => setClassroomForm({ ...classroomForm, maxCapacity: Number(e.target.value) })}
              required
            />
          </div>
          <div className="form-group">
            <label>Equipment (comma-separated)</label>
            <input
              type="text"
              value={classroomForm.equipment}
              onChange={(e) => setClassroomForm({ ...classroomForm, equipment: e.target.value })}
              placeholder="Projector, PCs"
            />
          </div>
          <button type="submit" className="submit-btn">Save Classroom</button>
        </form>
      </Modal>
    </div>
  );
}

export default RoomBookingsPage;
