import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import ptcLogo from '../assets/images/logo-ptc.png';
import loginBg from '../assets/images/loginbg.jpg';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-8">
          {/* Logo & title */}
          <div className="flex flex-col items-center mb-7">
            <img
              src={ptcLogo}
              alt="Pateros Technological College Logo"
              className="h-20 w-20 object-contain drop-shadow-md mb-3"
            />
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">CESSCA Portal</h2>
            <p className="text-sm font-semibold text-green-700 mt-0.5">Pateros Technological College</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span>&#x2715;</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiMail className="text-green-500" size={17} />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="block w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition duration-200 placeholder-gray-400 text-sm"
                  placeholder="your.email@ptc.edu.ph"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiLock className="text-green-500" size={17} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 py-3 bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition duration-200 placeholder-gray-400 text-sm"
                  placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-white text-sm tracking-wide bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-green-700 hover:text-green-800 hover:underline transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            For authorized PTC students, faculty, and staff only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;