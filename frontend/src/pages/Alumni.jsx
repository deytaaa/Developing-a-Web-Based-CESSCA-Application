import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import heroBg from '../assets/images/loginbg.jpg';
import { alumniService } from '../services/alumniService';
import { FiSearch, FiEye, FiAward, FiBriefcase, FiUser } from 'react-icons/fi';

const Alumni = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadAlumni();
    loadStats();
  }, [filterYear, filterStatus]);

  const loadAlumni = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterYear !== 'all') params.graduationYear = filterYear;
      if (filterStatus !== 'all') params.employmentStatus = filterStatus;
      
      const response = await alumniService.getAll(params);
      setAlumni(response.alumni || []);
    } catch (error) {
      console.error('Failed to load alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await alumniService.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getEmploymentStatusBadge = (status) => {
    const variants = {
      employed: 'success',
      'self-employed': 'info',
      unemployed: 'warning',
      studying: 'primary',
    };
    return variants[status] || 'default';
  };

  const filteredAlumni = alumni.filter((alum) =>
    `${alum.first_name} ${alum.last_name} ${alum.company_name || ''} ${alum.degree_program || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const graduationYears = ['all', '2023', '2022', '2021', '2020', '2019'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl h-[20rem] md:h-[23rem] border border-green-900"
          style={{
            backgroundImage: `linear-gradient(115deg, rgba(5, 74, 26, 0.88) 0%, rgba(0, 108, 27, 0.8) 52%, rgba(7, 64, 21, 0.88) 100%), url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_40%,rgba(250,204,21,0.2),transparent_38%),radial-gradient(circle_at_78%_60%,rgba(34,197,94,0.22),transparent_40%)]" />

          <div className="relative z-10 h-full flex items-center px-6 md:px-10">
            <div className="max-w-2xl">
              <p className="text-yellow-300 font-semibold tracking-wider uppercase text-xs md:text-sm mb-3">
                PTC CESSCA
              </p>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-yellow-300 drop-shadow-lg">
                Our Proud
                <span className="block text-white">Alumni</span>
              </h1>
              <p className="text-green-100 mt-4 text-sm md:text-base max-w-xl">
                Celebrating success, leadership, and excellence of Pateros Technological College graduates.
              </p>
            </div>
          </div>

          <div className="absolute right-6 top-7 hidden md:flex gap-3 opacity-80">
            <span className="w-7 h-11 border-2 border-yellow-400 -skew-x-[30deg]" />
            <span className="w-7 h-11 border-2 border-yellow-400 -skew-x-[30deg]" />
            <span className="w-7 h-11 border-2 border-yellow-400 -skew-x-[30deg]" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="sr-only">Alumni Management</h1>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="!p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                  <FiUser className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Alumni</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="!p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <FiBriefcase className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Employed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.employed || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="!p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gold-100 rounded-lg p-3">
                  <FiAward className="h-6 w-6 text-gold-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Achievements</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.achievements || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="!p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <FiBriefcase className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Employment Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total > 0 ? Math.round((stats.employed / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiSearch className="inline mr-1" /> Search
              </label>
              <input
                type="text"
                placeholder="Search by name, company, or degree..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                {graduationYears.map((year) => (
                  <option key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="studying">Studying</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Alumni List */}
        {loading ? (
          <LoadingSpinner centered size="lg" />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredAlumni.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <FiUser className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No alumni found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
                </div>
              </Card>
            ) : (
              filteredAlumni.map((alum) => {
                const hasProfile = alum.alumni_id != null;
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
                const profilePictureUrl = alum.profile_picture 
                    ? (alum.profile_picture?.startsWith('http')
                      ? alum.profile_picture
                      : `${backendUrl}${alum.profile_picture}`)
                  : null;
                
                return (
                <Card key={alum.user_id || alum.alumni_id} className="hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {profilePictureUrl ? (
                          <img
                            src={profilePictureUrl || '/default-avatar.png'}
                            onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                            alt={`${alum.first_name} ${alum.last_name}`}
                            className="h-12 w-12 rounded-full object-cover border-2 border-primary-600"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-lg">
                              {alum.first_name?.[0]}{alum.last_name?.[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {alum.first_name} {alum.last_name}
                            </h3>
                            {!hasProfile && (
                              <Badge variant="warning">Profile Incomplete</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{alum.degree_program || 'Not Provided'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Graduation Year</p>
                          <p className="text-sm font-medium text-gray-900">
                            {alum.graduation_year || 'Not Provided'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Employment Status</p>
                          {alum.current_employment_status ? (
                            <Badge variant={getEmploymentStatusBadge(alum.current_employment_status)}>
                              {alum.current_employment_status?.replace('-', ' ')}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-500">Not Provided</span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Company</p>
                          <p className="text-sm font-medium text-gray-900">
                            {alum.company_name || 'Not Provided'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Position</p>
                          <p className="text-sm font-medium text-gray-900">
                            {alum.job_position || 'Not Provided'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Industry</p>
                          <p className="text-sm font-medium text-gray-900">
                            {alum.industry || 'Not Provided'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Contact</p>
                          <p className="text-sm font-medium text-gray-900">
                            {alum.contact_email || alum.contact_number || alum.email || 'Not Provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {hasProfile ? (
                      <Link to={`/alumni/${alum.alumni_id}`}>
                        <Button variant="outline" size="sm">
                          <FiEye className="mr-1" /> View Profile
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <FiEye className="mr-1" /> View Profile
                      </Button>
                    )}
                  </div>
                </Card>
              )})
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Alumni;
