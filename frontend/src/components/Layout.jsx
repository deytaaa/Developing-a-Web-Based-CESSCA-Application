import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, FiUsers, FiAward, FiAlertCircle, FiTrendingUp,
  FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX, FiUser, FiCalendar, FiStar, FiInfo
} from 'react-icons/fi';
import ptcLogo from '../assets/images/logo-ptc.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FiHome, roles: ['all'] },
    { name: 'Organizations', href: '/organizations', icon: FiUsers, roles: ['student', 'officer', 'cessca_staff', 'admin'] },
    { name: 'Activities', href: '/activities', icon: FiCalendar, roles: ['officer', 'cessca_staff', 'admin'] },
    { name: 'Discipline', href: '/discipline', icon: FiAlertCircle, roles: ['student', 'officer', 'cessca_staff', 'admin'] },
    { name: 'Alumni', href: '/alumni', icon: FiAward, roles: ['alumni', 'cessca_staff', 'admin'] },
    { name: 'Arts, Culture & Sports', href: '/sports', icon: FiTrendingUp, roles: ['student', 'officer', 'cessca_staff', 'admin'] },
    { name: 'Achievements', href: '/achievements', icon: FiStar, roles: ['student', 'officer', 'alumni', 'cessca_staff', 'admin'] },
    { name: 'About PTC', href: '/about', icon: FiInfo, roles: ['student', 'officer', 'alumni', 'cessca_staff', 'admin'] },
    { name: 'Administration', href: '/admin', icon: FiSettings, roles: ['cessca_staff', 'admin'] },
  ];

  const filteredNavigation = navigation.filter(
    (item) => item.roles.includes('all') || item.roles.includes(user?.role)
  );

  const isActive = (path) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    // For exact matching on specific admin routes
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname.startsWith('/admin/users');
    }
    // Custom: Highlight Arts, Culture & Sports for /sports and /gallery
    if (path === '/sports') {
      return location.pathname.startsWith('/sports') || location.pathname.startsWith('/gallery');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary-800 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={ptcLogo} 
              alt="PTC Logo" 
              className="h-10 w-10 object-contain"
            />
            {sidebarOpen && (
              <h1 className="text-xl font-bold">CESSCA</h1>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-primary-700"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-100 hover:bg-primary-700'
                }`}
                title={!sidebarOpen ? item.name : ''}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-700">
          <Link
            to="/profile"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-primary-100 hover:bg-primary-700 mb-2"
            title={!sidebarOpen ? 'Profile' : ''}
          >
            <FiUser size={20} />
            {sidebarOpen && <span>Profile</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-primary-100 hover:bg-primary-700 w-full"
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <FiLogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              Pateros Technological College - CESSCA
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile?.first_name} {user?.profile?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
