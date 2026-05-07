import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getRoleLabel } from '../data/roles';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'D', roles: ['admin', 'student', 'professor', 'parent', 'staff'] },
  { path: '/courses', label: 'Courses', icon: 'C', roles: ['admin', 'student', 'professor'] },
  { path: '/staff-directory', label: 'Staff Directory', icon: 'S', roles: ['admin'] },
  { path: '/assignments', label: 'Assignments', icon: 'A', roles: ['admin', 'student', 'professor'] },
  { path: '/discussions', label: 'Discussions', icon: 'F', roles: ['admin', 'student', 'professor'] },
  { path: '/office-hours', label: 'Office Hours', icon: 'O', roles: ['admin', 'student', 'professor'] },
  { path: '/meetings', label: 'Meetings', icon: 'M', roles: ['admin', 'student', 'professor', 'parent', 'staff'] },
  { path: '/messages', label: 'Messages', icon: '@', roles: ['admin', 'student', 'professor', 'parent', 'staff'] },
  { path: '/announcements', label: 'Announcements', icon: 'N', roles: ['admin', 'student', 'professor'] },
  { path: '/applications', label: 'Applications', icon: 'P', roles: ['admin'] },
  { path: '/enrollments', label: 'Enrollments', icon: 'E', roles: ['admin'] },
  { path: '/students', label: 'Students', icon: 'T', roles: ['admin'] },
  { path: '/staff-availability', label: 'Staff Availability', icon: 'V', roles: ['admin'] },
  { path: '/room-bookings', label: 'Room Bookings', icon: 'R', roles: ['admin', 'staff'] },
  { path: '/leave-requests', label: 'Leave Requests', icon: 'L', roles: ['admin', 'staff'] },
  { path: '/payroll', label: 'Payroll', icon: '$', roles: ['admin', 'staff'] },
];

const studentMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'D' },
  { path: '/schedule', label: 'Schedule', icon: 'S' },
  { path: '/assignments', label: 'Assignments', icon: 'A' },
  { path: '/grades', label: 'Grades', icon: 'G' },
  { path: '/courses', label: 'Courses', icon: 'C' },
  { path: '/discussions', label: 'Discussions', icon: 'F' },
];

function Sidebar() {
  const { user = {}, logout } = useAuth();
  const role = user.role || 'student';
  const visibleItems = role === 'student'
    ? studentMenuItems
    : menuItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">University</h1>
        <span className="sidebar-subtitle">Management System</span>
        <span className="sidebar-role">{getRoleLabel(role)}</span>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
