import { useLocation, useNavigate } from 'react-router-dom';
import { getRoleLabel } from '../data/roles';
import './Topbar.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/courses': 'Courses',
  '/assignments': 'Assignments',
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const displayName = fullName || user.email || 'User';

  const getPageTitle = () => pageTitles[location.pathname] || 'Dashboard';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
