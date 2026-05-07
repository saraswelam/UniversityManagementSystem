import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getRoleLabel } from '../data/roles';
import './Topbar.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/schedule': 'Schedule',
  '/courses': 'Courses',
  '/assignments': 'Assignments',
  '/grades': 'Grades',
  '/discussions': 'Discussions',
  '/office-hours': 'Office Hours',
  '/meetings': 'Meetings',
  '/messages': 'Messages',
  '/announcements': 'Announcements',
  '/applications': 'Applications',
  '/enrollments': 'Enrollments',
  '/students': 'Students',
  '/staff-availability': 'Staff Availability',
};

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user = {}, logout } = useAuth();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const displayName = fullName || user.email || 'User';

  const getPageTitle = () => {
    if (location.pathname.startsWith('/courses/')) return 'Course Details';
    return pageTitles[location.pathname] || 'Dashboard';
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <h2 className="page-title">{getPageTitle()}</h2>
      <div className="topbar-actions">
        <div className="user-info">
          <div className="user-copy">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{getRoleLabel(user.role)}</span>
          </div>
          <div className="user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <button className="topbar-logout" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
