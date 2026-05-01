import { useState, useEffect } from 'react';
import { roomBookingsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './RoomBookingsPage.css';

function RoomBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    roomNumber: '',
    roomName: '',
    purpose: '',
  });
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await roomBookingsApi.getAll();
      setBookings(data);
    } catch (error) {
      toast.error('Failed to load bookings');
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
      fetchBookings();
    } catch (error) {
      toast.error(error.message);
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

  if (loading) return <div className="loading">Loading bookings...</div>;

  return (
    <div className="room-bookings-page">
      <div className="page-header">
        <h2>Room Bookings</h2>
        <button className="add-btn" onClick={openBookingModal}>
          ➕ Book a Room
        </button>
      </div>

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
    </div>
  );
}

export default RoomBookingsPage;
