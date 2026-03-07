import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import OrganizationDetails from './pages/OrganizationDetails';
import Activities from './pages/Activities';
import Alumni from './pages/Alumni';
import AlumniProfile from './pages/AlumniProfile';
import Discipline from './pages/Discipline';
import CaseDetails from './pages/CaseDetails';
import Sports from './pages/Sports';
import EventDetails from './pages/EventDetails';
import Gallery from './pages/Gallery';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Organizations */}
          <Route path="/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
          <Route path="/organizations/:id" element={<ProtectedRoute><OrganizationDetails /></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute roles={['officer', 'cessca_staff', 'admin']}><Activities /></ProtectedRoute>} />
          
          {/* Alumni */}
          <Route path="/alumni" element={<ProtectedRoute roles={['alumni', 'cessca_staff', 'admin']}><Alumni /></ProtectedRoute>} />
          <Route path="/alumni/:id" element={<ProtectedRoute roles={['alumni', 'cessca_staff', 'admin']}><AlumniProfile /></ProtectedRoute>} />
          
          {/* Discipline */}
          <Route path="/discipline" element={<ProtectedRoute><Discipline /></ProtectedRoute>} />
          <Route path="/discipline/cases/:id" element={<ProtectedRoute><CaseDetails /></ProtectedRoute>} />
          
          {/* Sports & Arts */}
          <Route path="/sports" element={<ProtectedRoute><Sports /></ProtectedRoute>} />
          <Route path="/sports/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          
          {/* Analytics */}
          <Route path="/analytics" element={<ProtectedRoute roles={['cessca_staff', 'admin']}><Analytics /></ProtectedRoute>} />
          
          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin', 'cessca_staff']}><Admin /></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
