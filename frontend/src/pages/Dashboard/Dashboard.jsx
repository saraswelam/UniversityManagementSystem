import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi, assignmentsApi, announcementsApi } from '../../services/api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    assignments: 0,
    announcements: 0,
    upcomingMeetings: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courses, assignments, announcements] = await Promise.all([
          coursesApi.getAll(),
          assignmentsApi.getAll(),
          announcementsApi.getAll(),
        ]);
        setStats({
          courses: courses.length || 0,
          assignments: assignments.length || 0,
          announcements: announcements.length || 0,
          upcomingMeetings: 0,
        });
        setRecentAnnouncements(announcements.slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <span className="stat-value">{stats.courses}</span>
            <span className="stat-label">Courses</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-value">{stats.assignments}</span>
            <span className="stat-label">Assignments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📢</div>
          <div className="stat-info">
            <span className="stat-value">{stats.announcements}</span>
            <span className="stat-label">Announcements</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.upcomingMeetings}</span>
            <span className="stat-label">Upcoming Meetings</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="recent-announcements">
          <h3 className="section-title">Recent Announcements</h3>
          {recentAnnouncements.length > 0 ? (
            <div className="announcement-list">
              {recentAnnouncements.map((announcement) => (
                <div
                  key={announcement._id}
                  className={`announcement-item${announcement.pinned ? ' pinned' : ''}${announcement.cancelled ? ' cancelled' : ''}`}
                >
                  <h4>{announcement.title}</h4>
                  <p>{announcement.content?.substring(0, 100)}...</p>
                  <span className="announcement-date">
                    {announcement.date || new Date(announcement.createdAt).toLocaleDateString()}
                    {announcement.cancelled ? ' • Cancelled' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No announcements yet</p>
          )}
        </div>

        <div className="quick-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => navigate('/courses?new=1')}>
              ➕ Add Course
            </button>
            <button className="action-btn">📝 Create Assignment</button>
            <button className="action-btn">📢 Post Announcement</button>
            <button className="action-btn">📅 Schedule Meeting</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;