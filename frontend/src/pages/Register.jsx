import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import ptcLogo from '../assets/images/logo-ptc.png';
import loginBg from '../assets/images/loginbg.jpg';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    firstName: '',
    middleName: '',
    lastName: '',
    studentId: '',
    course: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black opacity-60 z-0" />
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center relative z-10">
          <div className="mb-4 text-green-600 text-5xl">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your account has been created and is pending approval. You will be redirected to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{
      backgroundImage: `url(${loginBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-60 z-0" />
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={ptcLogo} 
              alt="Pateros Technological College Logo" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm font-semibold text-green-600">Join the CESSCA Portal - Pateros Technological College</p>
          <div className="mt-1 h-1 w-24 bg-gradient-to-r from-green-500 via-gold-400 to-green-500 mx-auto rounded-full"></div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                required
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-gray-400"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
              <input
                type="text"
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-gray-400"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                required
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-gray-400"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select
                required
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="officer">Organization Officer</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <input
                type="text"
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-gray-400"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course/Program</label>
              <select
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                required
              >
                <option value="">Select a course/program</option>
                <option value="Bachelor of Science in Information Technology (BSIT)">Bachelor of Science in Information Technology (BSIT)</option>
                <option value="Bachelor of Science in Office Administration (BSOA)">Bachelor of Science in Office Administration (BSOA)</option>
                <option value="Bachelor of Science in Accounting Information System (BSAIS)">Bachelor of Science in Accounting Information System (BSAIS)</option>
                <option value="Certificate in Computer Sciences (CCS)">Certificate in Computer Sciences (CCS)</option>
                <option value="Certificate in Office Administration (COA)">Certificate in Office Administration (COA)</option>
                <option value="Certificate in Hotel and Restaurant Management (CHRM)">Certificate in Hotel and Restaurant Management (CHRM)</option>
                <option value="Associate in Hotel and Restaurant Technology (AHRT)">Associate in Hotel and Restaurant Technology (AHRT)</option>
                <option value="Associate in Human Resource Development (AHRD)">Associate in Human Resource Development (AHRD)</option>
                <option value="Associate in Accounting Information System (AAIS)">Associate in Accounting Information System (AAIS)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                required
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-gray-400"
                placeholder="your.email@ptc.edu.ph"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                required
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-gray-400"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                required
                className="block w-full px-3 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 placeholder-gray-400"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
