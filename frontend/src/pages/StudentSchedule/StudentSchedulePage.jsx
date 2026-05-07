import { useEffect, useState } from 'react';
import { enrollmentsApi, meetingsApi, officeHoursApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import '../StudentDashboard/StudentDashboard.css';

function StudentSchedulePage() {
  const [meetings, setMeetings] = useState([]);
  const [officeHours, setOfficeHours] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [meetingData, officeHourData, enrollmentData] = await Promise.all([
          meetingsApi.getAll(),
          officeHoursApi.getAll(),
          enrollmentsApi.getMine(),
        ]);
        const courseProfessors = Array.from(new Set(
          enrollmentData
            .map((enrollment) => enrollment.course?.professor)
            .filter((professor) => professor && professor !== 'General')
        ));
        setMeetings(meetingData);
        setProfessors(courseProfessors);
        setOfficeHours(officeHourData.filter((item) => courseProfessors.includes(item.professor)));
      } catch (error) {
        toast.error(error.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading schedule...</div>;

  return (
    <div className="student-page">
      <section className="student-hero">
        <div>
          <p className="student-kicker">Schedule</p>
          <h2>Meetings and office hours</h2>
        </div>
      </section>

      <div className="student-dashboard-grid">
        <section className="student-panel">
          <div className="student-panel-header">
            <h3>Your Meetings</h3>
          </div>
          <div className="student-assignment-list">
            {meetings.length > 0 ? meetings.map((meeting) => (
              <article className="student-assignment-row" key={meeting._id}>
                <div>
                  <span className="student-course-code">{meeting.status || 'pending'}</span>
                  <h4>{meeting.title}</h4>
                  <p className="student-description">{meeting.professor || 'Professor TBA'} - {meeting.mode || 'In person'} - {meeting.durationMinutes || 15} minutes</p>
                </div>
                <span className="student-due-date">
                  {meeting.date ? new Date(meeting.date).toLocaleDateString() : 'TBD'} {meeting.time || ''}
                </span>
              </article>
            )) : (
              <p className="student-empty">No meetings booked yet.</p>
            )}
          </div>
        </section>

        <section className="student-panel">
          <div className="student-panel-header">
            <h3>Office Hours</h3>
          </div>
          <div className="office-hour-list">
            {professors.length === 0 ? (
              <p className="student-empty">Register courses with assigned professors to see office hours.</p>
            ) : officeHours.length > 0 ? officeHours.map((item) => (
              <div className="office-hour-row" key={item._id}>
                <span>{item.professor}</span>
                <strong>{item.day} {item.startTime} - {item.endTime}</strong>
                <span>{item.location || item.mode || 'TBD'}</span>
              </div>
            )) : (
              <p className="student-empty">No office hours listed yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentSchedulePage;
