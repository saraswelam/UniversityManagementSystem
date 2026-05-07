import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementsApi, assignmentsApi, coursesApi, meetingsApi } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import './Dashboard.css';

function isUpcomingMeeting(meeting) {
  if (!meeting.date || meeting.status === 'cancelled') return false;

  const meetingDate = new Date(`${meeting.date}T${meeting.time || '00:00'}`);
  return meetingDate >= new Date();
}

function isElectiveRegistrationOpen(course) {
  const now = new Date();
  const start = course.registrationStart ? new Date(course.registrationStart) : null;
  const end = course.registrationEnd ? new Date(course.registrationEnd) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function Dashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    assignments: 0,
    announcements: 0,
    upcomingMeetings: 0,
    electiveRegistration: 'Closed',
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user = {} } = useAuth();
  const role = user.role || 'student';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courses, assignments, announcements, meetings] = await Promise.all([
          coursesApi.getAll(),
          role === 'professor' ? assignmentsApi.getAll() : Promise.resolve([]),
          announcementsApi.getAll(),
          meetingsApi.getAll(),
        ]);

        const electives = courses.filter((course) => course.type === 'elective');
        const registrationOpen = electives.some(isElectiveRegistrationOpen);

        setStats({
          courses: courses.length,
          assignments: assignments.length,
          announcements: announcements.length,
          upcomingMeetings: meetings.filter(isUpcomingMeeting).length,
          electiveRegistration: electives.length > 0 && registrationOpen ? 'Open' : 'Closed',
        });
        setRecentAnnouncements(announcements.slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  const quickActions = [
    role === 'professor' && {
      label: 'Create Assignment',
      path: '/assignments?new=1',
    },
    role === 'admin' && {
      label: 'Post Announcement',
      path: '/announcements?new=1',
    },
    {
      label: 'Schedule Meeting',
      path: '/meetings?new=1',
    },
  ].filter(Boolean);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <button type="button" className="stat-card" onClick={() => navigate('/courses')}>
          <div className="stat-icon">C</div>
          <div className="stat-info">
            <span className="stat-value">{stats.courses}</span>
            <span className="stat-label">Courses</span>
          </div>
        </button>
        {role === 'professor' && (
          <button type="button" className="stat-card" onClick={() => navigate('/assignments')}>
            <div className="stat-icon">A</div>
            <div className="stat-info">
              <span className="stat-value">{stats.assignments}</span>
              <span className="stat-label">Assignments</span>
            </div>
          </button>
        )}
        <button type="button" className="stat-card" onClick={() => navigate('/announcements')}>
          <div className="stat-icon">N</div>
          <div className="stat-info">
            <span className="stat-value">{stats.announcements}</span>
            <span className="stat-label">Announcements</span>
          </div>
        </button>
        <button type="button" className="stat-card" onClick={() => navigate('/meetings')}>
          <div className="stat-icon">M</div>
          <div className="stat-info">
            <span className="stat-value">{stats.upcomingMeetings}</span>
            <span className="stat-label">Upcoming Meetings</span>
          </div>
        </button>
        <button type="button" className="stat-card" onClick={() => navigate('/courses')}>
          <div className="stat-icon">E</div>
          <div className="stat-info">
            <span className="stat-value">{stats.electiveRegistration}</span>
            <span className="stat-label">Elective Registration</span>
          </div>
        </button>
      </div>

      <div className="dashboard-sections">
        <div className="recent-announcements">
          <h3 className="section-title">Recent Announcements</h3>
          {recentAnnouncements.length > 0 ? (
            <div className="announcement-list">
              {recentAnnouncements.map((announcement) => (
                <button
                  type="button"
                  key={announcement._id}
                  className={`announcement-item${announcement.pinned ? ' pinned' : ''}${announcement.cancelled ? ' cancelled' : ''}`}
                  onClick={() => navigate('/announcements')}
                >
                  <h4>{announcement.title}</h4>
                  <p>{announcement.content?.substring(0, 100)}...</p>
                  <span className="announcement-date">
                    {announcement.date || new Date(announcement.createdAt).toLocaleDateString()}
                    {announcement.cancelled ? ' - Cancelled' : ''}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-message">No announcements yet</p>
          )}
        </div>

        <div className="quick-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-buttons">
            {quickActions.map((action) => (
              <button
                key={action.path}
                type="button"
                className="action-btn"
                onClick={() => navigate(action.path)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
