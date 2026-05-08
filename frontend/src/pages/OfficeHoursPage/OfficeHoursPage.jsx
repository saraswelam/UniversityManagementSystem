import { useState, useEffect, useMemo } from 'react';
import { officeHoursApi, coursesApi, enrollmentsApi, meetingsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
import './OfficeHoursPage.css';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOT_MINUTES = 15;

const getCourse = (enrollment) => enrollment.course || enrollment;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function timeToMinutes(value) {
  if (!value) return NaN;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return (hours * 60) + minutes;
}

function minutesToTime(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isPastSlot(dateValue, timeValue) {
  if (!dateValue || !timeValue) return false;
  const dateParts = dateValue.split('-').map(Number);
  const timeParts = timeValue.split(':').map(Number);
  if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) return false;
  if (timeParts.length < 2 || timeParts.some(Number.isNaN)) return false;
  const slotTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);
  return slotTime <= new Date();
}

function buildSlots(officeHours, weekStart) {
  const slots = [];
  const dayIndex = WEEK_DAYS.reduce((acc, day, index) => {
    acc[day] = index;
    return acc;
  }, {});

  officeHours.forEach((item) => {
    const index = dayIndex[item.day];
    if (index === undefined) return;

    const startMinutes = timeToMinutes(item.startTime);
    const endMinutes = timeToMinutes(item.endTime);

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) return;

    const date = addDays(weekStart, index);
    const dateKey = formatISODate(date);

    for (let time = startMinutes; time + SLOT_MINUTES <= endMinutes; time += SLOT_MINUTES) {
      slots.push({
        id: `${item._id}-${dateKey}-${time}`,
        date: dateKey,
        time: minutesToTime(time),
        professor: item.professor,
        location: item.location,
        mode: item.mode,
      });
    }
  });

  return slots;
}

function OfficeHoursPage() {
  const { user = {} } = useAuth();
  const isProfessor = user.role === 'professor';
  const isStudent = user.role === 'student';
  const [officeHours, setOfficeHours] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [busySlots, setBusySlots] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ day: '', startTime: '', endTime: '', location: '', courseId: '' });
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingData, setBookingData] = useState({
    title: '',
    mode: 'In person',
    description: '',
    link: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [isProfessor, isStudent]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isProfessor) {
        const [officeHoursData, coursesData] = await Promise.all([
          officeHoursApi.getAll(),
          coursesApi.getAll(),
        ]);
        setOfficeHours(officeHoursData);
        setCourses(coursesData);
      } else if (isStudent) {
        const [officeHoursData, enrollmentData] = await Promise.all([
          officeHoursApi.getAll(),
          enrollmentsApi.getMine(),
        ]);
        setOfficeHours(officeHoursData);
        setEnrollments(enrollmentData);
      } else {
        const officeHoursData = await officeHoursApi.getAll();
        setOfficeHours(officeHoursData);
      }
    } catch (error) {
      toast.error('Failed to load office hours');
    } finally {
      setLoading(false);
    }
  };

  const enrollmentProfessors = useMemo(() => {
    if (!isStudent) return [];
    return enrollments
      .map((enrollment) => getCourse(enrollment)?.professor)
      .filter((professor) => professor && professor !== 'General');
  }, [enrollments, isStudent]);

  const officeHourProfessors = useMemo(() => {
    if (!isStudent) return [];
    return officeHours
      .map((item) => item.professor)
      .filter((professor) => professor && professor !== 'General');
  }, [officeHours, isStudent]);

  const professors = useMemo(() => {
    if (!isStudent) return [];
    const preferred = enrollmentProfessors.length > 0 ? enrollmentProfessors : officeHourProfessors;
    return Array.from(new Set(preferred)).sort();
  }, [enrollmentProfessors, officeHourProfessors, isStudent]);

  useEffect(() => {
    if (!isStudent) return;
    if (!selectedProfessor && professors.length > 0) {
      setSelectedProfessor(professors[0]);
    }
  }, [isStudent, professors, selectedProfessor]);

  useEffect(() => {
    if (!isStudent || !selectedProfessor) return;

    const startDate = formatISODate(weekStart);
    const endDate = formatISODate(addDays(weekStart, WEEK_DAYS.length - 1));

    meetingsApi.getBusySlots(selectedProfessor, startDate, endDate)
      .then((data) => setBusySlots(data))
      .catch(() => toast.error('Failed to load booked slots'));
  }, [isStudent, selectedProfessor, weekStart, toast]);

  const visibleOfficeHours = useMemo(() => {
    if (!isStudent) return officeHours;
    if (!selectedProfessor) return [];
    return officeHours.filter((item) => item.professor === selectedProfessor);
  }, [officeHours, selectedProfessor, isStudent]);

  const weekDays = useMemo(() => (
    WEEK_DAYS.map((day, index) => {
      const date = addDays(weekStart, index);
      return {
        label: day,
        date,
        dateKey: formatISODate(date),
        shortDate: formatShortDate(date),
      };
    })
  ), [weekStart]);

  const calendarSlots = useMemo(() => buildSlots(visibleOfficeHours, weekStart), [visibleOfficeHours, weekStart]);

  const slotsByDate = useMemo(() => {
    const map = new Map();
    weekDays.forEach((day) => map.set(day.dateKey, []));
    calendarSlots.forEach((slot) => {
      const entry = map.get(slot.date);
      if (entry) entry.push(slot);
    });

    map.forEach((list) => list.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)));
    return map;
  }, [calendarSlots, weekDays]);

  const bookedLookup = useMemo(() => (
    new Set(busySlots.map((slot) => `${slot.date}|${slot.time}`))
  ), [busySlots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await officeHoursApi.update(editingItem._id, formData);
        toast.success('Office hours updated');
      } else {
        await officeHoursApi.create(formData);
        toast.success('Office hours created');
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ day: '', startTime: '', endTime: '', location: '', courseId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      courseId: item.courseId?._id || item.courseId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete these office hours?')) {
      try {
        await officeHoursApi.delete(id);
        toast.success('Office hours deleted');
        fetchData();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId || c._id === courseId?._id);
    return course?.name || 'General';
  };

  const handleSlotSelect = (slot) => {
    if (isPastSlot(slot.date, slot.time)) {
      toast.error('Please choose a future slot');
      return;
    }
    setSelectedSlot(slot);
    setBookingData({
      title: '',
      mode: 'In person',
      description: '',
      link: '',
    });
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    if (!selectedSlot || !selectedProfessor) return;
    if (isPastSlot(selectedSlot.date, selectedSlot.time)) {
      toast.error('Please choose a future slot');
      return;
    }

    try {
      await meetingsApi.create({
        title: bookingData.title,
        description: bookingData.description,
        link: bookingData.mode === 'Virtual' ? bookingData.link : '',
        date: selectedSlot.date,
        time: selectedSlot.time,
        professor: selectedProfessor,
        mode: bookingData.mode,
      });
      toast.success('Meeting booked for 15 minutes');
      setBookingModalOpen(false);
      setSelectedSlot(null);
      setBookingData({
        title: '',
        mode: 'In person',
        description: '',
        link: '',
      });

      const startDate = formatISODate(weekStart);
      const endDate = formatISODate(addDays(weekStart, WEEK_DAYS.length - 1));
      const data = await meetingsApi.getBusySlots(selectedProfessor, startDate, endDate);
      setBusySlots(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="loading">Loading office hours...</div>;

  if (isStudent) {
    const weekRange = weekDays.length > 0
      ? `${weekDays[0].shortDate} - ${weekDays[weekDays.length - 1].shortDate}`
      : '';

    return (
      <div className="office-hours-page student-office-hours">
        <div className="page-header">
          <div>
            <h2>Office Hours Calendar</h2>
            <p className="page-subtitle">Book a 15-minute slot with your instructor.</p>
          </div>
          <div className="week-controls">
            <button className="week-btn" type="button" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              Previous week
            </button>
            <span className="week-range">{weekRange}</span>
            <button className="week-btn" type="button" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              Next week
            </button>
          </div>
        </div>

        <div className="calendar-filters">
          <div className="form-group">
            <label>Instructor</label>
            <select
              value={selectedProfessor}
              onChange={(e) => setSelectedProfessor(e.target.value)}
              disabled={professors.length === 0}
            >
              {professors.length === 0 && (
                <option value="">No instructors with office hours yet</option>
              )}
              {professors.map((professor) => (
                <option key={professor} value={professor}>{professor}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-swatch open" />Open
          </span>
          <span className="legend-item">
            <span className="legend-swatch booked" />Booked
          </span>
        </div>

        {professors.length === 0 ? (
          <p className="empty-message">No office hours are published yet. Check back later.</p>
        ) : (
          <div className="office-hours-calendar">
            {weekDays.map((day) => {
              const slotsForDay = slotsByDate.get(day.dateKey) || [];
              return (
                <div key={day.dateKey} className="calendar-column">
                  <div className="calendar-day">
                    <span className="calendar-day-name">{day.label}</span>
                    <span className="calendar-day-date">{day.shortDate}</span>
                  </div>
                  <div className="calendar-slots">
                    {slotsForDay.length > 0 ? (
                      slotsForDay.map((slot) => {
                        const isBooked = bookedLookup.has(`${slot.date}|${slot.time}`);
                        const isPast = isPastSlot(slot.date, slot.time);
                        const statusClass = isPast ? 'past' : isBooked ? 'booked' : 'open';
                        const statusLabel = isPast ? 'Past' : isBooked ? 'Booked' : 'Open';
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            className={`slot-card ${statusClass}`}
                            disabled={isBooked || isPast}
                            onClick={() => handleSlotSelect(slot)}
                          >
                            <span className="slot-time">{slot.time}</span>
                            <span className="slot-meta">{statusLabel} - {slot.location || slot.mode || 'TBD'}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="calendar-empty">No office hours</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} title="Book a 15-minute meeting">
          <form onSubmit={handleBookingSubmit} className="office-hours-form">
            <div className="booking-summary">
              <p><strong>Instructor:</strong> {selectedProfessor || 'TBD'}</p>
              <p><strong>Date:</strong> {selectedSlot?.date || ''} {selectedSlot?.time ? `at ${selectedSlot.time}` : ''}</p>
            </div>
            <div className="form-group">
              <label>Meeting Subject</label>
              <input
                type="text"
                value={bookingData.title}
                onChange={(e) => setBookingData({ ...bookingData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Mode</label>
              <select
                value={bookingData.mode}
                onChange={(e) => setBookingData({ ...bookingData, mode: e.target.value })}
              >
                <option value="In person">In person</option>
                <option value="Virtual">Virtual</option>
              </select>
            </div>
            {bookingData.mode === 'Virtual' && (
              <div className="form-group">
                <label>Meeting Link</label>
                <input
                  type="url"
                  value={bookingData.link}
                  onChange={(e) => setBookingData({ ...bookingData, link: e.target.value })}
                  placeholder="https://"
                />
              </div>
            )}
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={bookingData.description}
                onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                rows="3"
              />
            </div>
            <button type="submit" className="submit-btn" disabled={!selectedSlot}>Book Slot</button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="office-hours-page">
      <div className="page-header">
        <h2>Office Hours</h2>
        <button className="add-btn" onClick={() => { setEditingItem(null); setFormData({ day: '', startTime: '', endTime: '', location: '', courseId: '' }); setShowModal(true); }}>
          Add Office Hours
        </button>
      </div>

      <div className="office-hours-list">
        {officeHours.length > 0 ? (
          officeHours.map((item) => (
            <div key={item._id} className="office-hours-card">
              <div className="office-hours-header">
                <span className="office-hours-day">{item.day}</span>
                <div className="office-hours-actions">
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item._id)}>Delete</button>
                </div>
              </div>
              <div className="office-hours-details">
                <p>Time: {item.startTime} - {item.endTime}</p>
                <p>Location: {item.location || 'TBD'}</p>
                <p>Course: {getCourseName(item.courseId)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">No office hours scheduled</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Office Hours' : 'Add Office Hours'}>
        <form onSubmit={handleSubmit} className="office-hours-form">
          <div className="form-group">
            <label>Day</label>
            <select value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })} required>
              <option value="">Select day</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Room 301" />
          </div>
          <div className="form-group">
            <label>Course (optional)</label>
            <select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}>
              <option value="">General</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-btn">{editingItem ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </div>
  );
}

export default OfficeHoursPage;
