import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Table from '../components/Table';
import { adminService } from '../services/adminService';
import activityLogService from '../services/activityLogService';
import { organizationService } from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import { FiCheck, FiX, FiTrash2, FiEdit, FiPlus, FiEye, FiSearch } from 'react-icons/fi';

const Admin = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit, setLogsLimit] = useState(25);
  const [logsTotal, setLogsTotal] = useState(0);

  // Define tabs based on user role
  const allTabs = [
    { id: 'users', label: 'User Management', roles: ['admin'] },
    { id: 'organizations', label: 'Organizations', roles: ['cessca_staff', 'admin'] },
    { id: 'announcements', label: 'Announcements', roles: ['cessca_staff', 'admin'] },
    { id: 'logs', label: 'Activity Logs', roles: ['admin'] },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => tab.roles.includes(currentUser?.role));
  
  // Get the first available tab for this user, or from URL parameter
  const defaultTab = tabs.length > 0 ? tabs[0].id : 'users';
  const tabParam = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState(tabParam);

  // Sync tab with URL
  useEffect(() => {
    if (activeTab !== searchParams.get('tab')) {
      navigate(`?tab=${activeTab}`, { replace: true });
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Update activeTab if URL changes (e.g., browser navigation)
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    // eslint-disable-next-line
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(25);
  const [usersTotal, setUsersTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    announcement_type: 'general',
    target_audience: 'all',
    priority: 'normal',
  });
  const [orgForm, setOrgForm] = useState({
    org_name: '',
    org_acronym: '',
    org_type: 'academic',
    description: '',
    mission: '',
    vision: '',
    status: 'active',
  });
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    role: 'student',
    first_name: '',
    middle_name: '',
    last_name: '',
    student_id: '',
    course: '',
    contact_number: '',
  });

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers(usersPage, usersLimit);
    } else if (activeTab === 'organizations') {
      loadOrganizations();
    } else if (activeTab === 'announcements') {
      loadAnnouncements();
    } else if (activeTab === 'logs') {
      loadActivityLogs(logsPage, logsLimit);
    }
    // eslint-disable-next-line
  }, [activeTab, logsPage, logsLimit, usersPage, usersLimit]);

  const loadActivityLogs = async (page = 1, limit = 25) => {
    setLogsLoading(true);
    try {
      const res = await activityLogService.getAll(page, limit);
      setActivityLogs(res.logs || []);
      setLogsTotal(res.total || 0);
    } catch (error) {
      setActivityLogs([]);
      setLogsTotal(0);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadUsers = async (page = 1, limit = 25) => {
    setLoading(true);
    try {
      const [pendingResponse, allResponse] = await Promise.all([
        adminService.getPendingUsers(),
        adminService.getUsers({ page, limit })
      ]);
      setPendingUsers(pendingResponse.users || []);
      setAllUsers(allResponse.users || []);
      setUsersTotal(allResponse.total || 0);
    } catch (error) {
      setPendingUsers([]);
      setAllUsers([]);
      setUsersTotal(0);
    } finally {
      setLoading(false);
    }
  };


  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const [orgsResponse, pendingResponse] = await Promise.all([
        organizationService.getAll(),
        adminService.getPendingMembers()
      ]);
      setOrganizations(orgsResponse.organizations || []);
      setPendingMembers(pendingResponse.members || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMember = async (memberId) => {
    try {
      await adminService.approveMembership(memberId);
      alert('Membership approved successfully!');
      loadOrganizations();
    } catch (error) {
      alert('Failed to approve membership');
    }
  };

  const handleRejectMember = async (memberId) => {
    try {
      await adminService.rejectMembership(memberId);
      alert('Membership rejected successfully!');
      loadOrganizations();
    } catch (error) {
      alert('Failed to reject membership');
    }
  };

  const handleCreateOrg = () => {
    setEditingOrg(null);
    setOrgForm({
      org_name: '',
      org_acronym: '',
      org_type: 'academic',
      description: '',
      mission: '',
      vision: '',
      status: 'active',
    });
    setShowOrgModal(true);
  };

  const handleEditOrg = (org) => {
    setEditingOrg(org);
    setOrgForm({
      org_name: org.org_name,
      org_acronym: org.org_acronym,
      org_type: org.org_type,
      description: org.description || '',
      mission: org.mission || '',
      vision: org.vision || '',
      status: org.status,
    });
    setShowOrgModal(true);
  };

  const handleSubmitOrg = async (e) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await organizationService.update(editingOrg.org_id, orgForm);
        alert('Organization updated successfully!');
      } else {
        await organizationService.create(orgForm);
        alert('Organization created successfully!');
      }
      setShowOrgModal(false);
      loadOrganizations();
    } catch (error) {
      alert(`Failed to ${editingOrg ? 'update' : 'create'} organization`);
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;
    
    try {
      await organizationService.delete(orgId);
      alert('Organization deleted successfully!');
      loadOrganizations();
    } catch (error) {
      alert('Failed to delete organization');
    }
  };

  const handleApproveUser = async (userId, status) => {
    try {
      await adminService.approveUser(userId, status);
      alert(`User ${status === 'active' ? 'approved' : 'rejected'} successfully!`);
      loadUsers();
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminService.deleteUser(userId);
      alert('User deleted successfully!');
      loadUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(createUserForm);
      alert('User created successfully!');
      setShowCreateUserModal(false);
      setCreateUserForm({
        email: '',
        password: '',
        role: 'student',
        first_name: '',
        middle_name: '',
        last_name: '',
        student_id: '',
        course: '',
        contact_number: '',
      });
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await adminService.createAnnouncement(announcementForm);
      alert('Announcement created successfully!');
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        title: '',
        content: '',
        announcement_type: 'general',
        target_audience: 'all',
        priority: 'normal',
      });
      loadAnnouncements();
    } catch (error) {
      alert('Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await adminService.deleteAnnouncement(id);
      alert('Announcement deleted successfully!');
      loadAnnouncements();
    } catch (error) {
      alert('Failed to delete announcement');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      cessca_staff: 'warning',
      officer: 'info',
      student: 'default',
      alumni: 'success',
    };
    return variants[role] || 'default';
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      pending: 'warning',
      inactive: 'default',
    };
    return variants[status] || 'default';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <Badge variant={currentUser?.role === 'admin' ? 'primary' : 'warning'}>
            {currentUser?.role === 'admin' ? 'Admin Access' : 'CESSCA Staff Access'}
          </Badge>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <LoadingSpinner centered size="lg" />
        ) : (
          <>
            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search Bar */}
                <Card>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users by name, email, or student ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                    />
                  </div>
                </Card>

                {/* Pending Approvals */}
                {pendingUsers.filter((user) => {
                  const search = searchTerm.toLowerCase();
                  return (
                    user.first_name?.toLowerCase().includes(search) ||
                    user.last_name?.toLowerCase().includes(search) ||
                    user.email?.toLowerCase().includes(search) ||
                    user.student_id?.toLowerCase().includes(search)
                  );
                }).length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Pending Approvals ({pendingUsers.filter((user) => {
                          const search = searchTerm.toLowerCase();
                          return (
                            user.first_name?.toLowerCase().includes(search) ||
                            user.last_name?.toLowerCase().includes(search) ||
                            user.email?.toLowerCase().includes(search) ||
                            user.student_id?.toLowerCase().includes(search)
                          );
                        }).length})
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingUsers.filter((user) => {
                            const search = searchTerm.toLowerCase();
                            return (
                              user.first_name?.toLowerCase().includes(search) ||
                              user.last_name?.toLowerCase().includes(search) ||
                              user.email?.toLowerCase().includes(search) ||
                              user.student_id?.toLowerCase().includes(search)
                            );
                          }).map((user) => (
                            <tr key={user.user_id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={getRoleBadge(user.role)}>{user.role}</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.student_id || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleApproveUser(user.user_id, 'active')}
                                  >
                                    <FiCheck className="mr-1" /> Approve
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleApproveUser(user.user_id, 'inactive')}
                                  >
                                    <FiX className="mr-1" /> Reject
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {pendingUsers.filter((user) => {
                  const search = searchTerm.toLowerCase();
                  return (
                    user.first_name?.toLowerCase().includes(search) ||
                    user.last_name?.toLowerCase().includes(search) ||
                    user.email?.toLowerCase().includes(search) ||
                    user.student_id?.toLowerCase().includes(search)
                  );
                }).length === 0 && pendingUsers.length > 0 && searchTerm && (
                  <Card>
                    <p className="text-gray-500 text-center py-8">No users found matching "{searchTerm}"</p>
                  </Card>
                )}

                {pendingUsers.length === 0 && (
                  <Card>
                    <p className="text-gray-500 text-center py-8">No pending user approvals</p>
                  </Card>
                )}

                {/* All Users - Admin Only */}
                {currentUser?.role === 'admin' && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        All Users Management
                        <span className="ml-2 text-xs text-gray-500">Page {usersPage} of {Math.ceil(usersTotal / usersLimit) || 1} | {usersTotal} users</span>
                      </h2>
                      <Button
                        variant="primary"
                        onClick={() => setShowCreateUserModal(true)}
                      >
                        <FiPlus className="mr-2" /> Create User
                      </Button>
                    </div>
                    {allUsers.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                      </p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {allUsers
                              .filter((user) => {
                                const search = searchTerm.toLowerCase();
                                return (
                                  user.first_name?.toLowerCase().includes(search) ||
                                  user.last_name?.toLowerCase().includes(search) ||
                                  user.email?.toLowerCase().includes(search) ||
                                  user.student_id?.toLowerCase().includes(search)
                                );
                              })
                              .map((user) => (
                              <tr key={user.user_id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge variant={getRoleBadge(user.role)}>{user.role}</Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge variant={getStatusBadge(user.status)}>{user.status}</Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {user.user_id === currentUser.user_id ? (
                                    <span
                                      title="You cannot delete your own account"
                                      className="inline-block"
                                    >
                                      <FiTrash2 style={{ color: '#ff0000', opacity: 0.6, cursor: 'not-allowed' }} />
                                    </span>
                                  ) : (
                                    <span title="Delete user">
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDeleteUser(user.user_id)}
                                      >
                                        <FiTrash2 />
                                      </Button>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-gray-500">
                          Page {usersPage} of {Math.ceil(usersTotal / usersLimit) || 1} | {usersTotal} users
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                            onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                            disabled={usersPage === 1}
                          >
                            Prev
                          </button>
                          <button
                            className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                            onClick={() => setUsersPage((p) => p + 1)}
                            disabled={usersPage >= Math.ceil(usersTotal / usersLimit)}
                          >
                            Next
                          </button>
                          <select
                            className="ml-2 px-2 py-1 text-xs border rounded"
                            value={usersLimit}
                            onChange={e => { setUsersLimit(Number(e.target.value)); setUsersPage(1); }}
                          >
                            {[10, 25, 50, 100].map((n) => (
                              <option key={n} value={n}>{n} / page</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      </>
                    )}
                  </Card>
                )}
              </div>
            )}

            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
              <div className="space-y-6">
                {/* Pending Membership Requests */}
                {pendingMembers.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Pending Membership Requests ({pendingMembers.length})
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingMembers.map((member) => (
                            <tr key={member.member_id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    {member.profile_picture ? (
                                      <img
                                        className="h-10 w-10 rounded-full"
                                        src={member.profile_picture
                                          ? (member.profile_picture.startsWith('http')
                                              ? member.profile_picture
                                              : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${member.profile_picture}`)
                                          : '/default-avatar.png'}
                                        onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                                        alt="Profile"
                                        onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                        <span className="text-primary-600 font-medium text-sm">
                                          {member.first_name?.[0]}{member.last_name?.[0]}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {member.first_name} {member.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">{member.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {member.student_id || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{member.org_acronym}</div>
                                <div className="text-sm text-gray-500">{member.org_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(member.joined_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleApproveMember(member.member_id)}
                                >
                                  <FiCheck className="mr-1" /> Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRejectMember(member.member_id)}
                                >
                                  <FiX className="mr-1" /> Reject
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Manage Organizations */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Manage Organizations</h2>
                    <Button variant="primary" onClick={handleCreateOrg}>
                      <FiPlus className="mr-2" /> New Organization
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acronym</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {organizations.map((org) => (
                          <tr key={org.org_id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{org.org_acronym}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{org.org_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={org.org_type === 'academic' ? 'primary' : org.org_type === 'sports' ? 'warning' : 'success'}>
                                {org.org_type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {org.member_count || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={org.status === 'active' ? 'success' : 'warning'}>
                                {org.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOrg(org)}
                              >
                                <FiEdit />
                              </Button>
                              {currentUser?.role === 'admin' && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteOrg(org.org_id)}
                                >
                                  <FiTrash2 />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {organizations.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No organizations found</p>
                  )}
                </Card>
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                    <Button variant="primary" onClick={() => setShowAnnouncementModal(true)}>
                      <FiPlus className="mr-2" /> New Announcement
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div key={announcement.announcement_id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                     <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="default">{announcement.announcement_type}</Badge>
                              <Badge variant={announcement.priority === 'high' ? 'danger' : 'default'}>
                                {announcement.priority}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(announcement.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Logs</h2>
                {logsLoading ? (
                  <LoadingSpinner centered size="lg" />
                ) : activityLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No activity logs found.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activityLogs.map((log) => (
                            <tr key={log.log_id}>
                              <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">{log.email || 'System'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">{log.role || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">{log.action}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs max-w-xs truncate" title={log.description}>{log.description}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">{log.ip_address}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-gray-500">
                        Page {logsPage} of {Math.ceil(logsTotal / logsLimit) || 1} | {logsTotal} logs
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                          onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                          disabled={logsPage === 1}
                        >
                          Prev
                        </button>
                        <button
                          className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                          onClick={() => setLogsPage((p) => p + 1)}
                          disabled={logsPage >= Math.ceil(logsTotal / logsLimit)}
                        >
                          Next
                        </button>
                        <select
                          className="ml-2 px-2 py-1 text-xs border rounded"
                          value={logsLimit}
                          onChange={e => { setLogsLimit(Number(e.target.value)); setLogsPage(1); }}
                        >
                          {[10, 25, 50, 100].map((n) => (
                            <option key={n} value={n}>{n} / page</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )}
          </>
        )}
      </div>

      {/* Announcement Modal */}
      <Modal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        title="Create Announcement"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              required
              rows={4}
              className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
                value={announcementForm.announcement_type}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, announcement_type: e.target.value })}
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="organization">Organization</option>
                <option value="sports">Sports</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select
              className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg"
              value={announcementForm.target_audience}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, target_audience: e.target.value })}
            >
              <option value="all">All Users</option>
              <option value="students">Students Only</option>
              <option value="officers">Officers Only</option>
              <option value="alumni">Alumni Only</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setShowAnnouncementModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Announcement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Organization Modal */}
      <Modal
        isOpen={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        title={editingOrg ? 'Edit Organization' : 'Create Organization'}
      >
        <form onSubmit={handleSubmitOrg} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              required
              className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={orgForm.org_name}
              onChange={(e) => setOrgForm({ ...orgForm, org_name: e.target.value })}
              placeholder="e.g., Supreme Student Council"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acronym</label>
            <input
              type="text"
              required
              maxLength={10}
              className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={orgForm.org_acronym}
              onChange={(e) => setOrgForm({ ...orgForm, org_acronym: e.target.value.toUpperCase() })}
              placeholder="e.g., SSC"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                required
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={orgForm.org_type}
                onChange={(e) => setOrgForm({ ...orgForm, org_type: e.target.value })}
              >
                <option value="academic">Academic</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
                <option value="social">Social</option>
                <option value="special_interest">Special Interest</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                required
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={orgForm.status}
                onChange={(e) => setOrgForm({ ...orgForm, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={orgForm.description}
              onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
              placeholder="Brief description of the organization..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mission</label>
            <textarea
              rows={2}
              className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={orgForm.mission}
              onChange={(e) => setOrgForm({ ...orgForm, mission: e.target.value })}
              placeholder="Organization's mission statement..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vision</label>
            <textarea
              rows={2}
              className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={orgForm.vision}
              onChange={(e) => setOrgForm({ ...orgForm, vision: e.target.value })}
              placeholder="Organization's vision statement..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setShowOrgModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingOrg ? 'Update Organization' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.role}
                onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="officer">Officer</option>
                <option value="alumni">Alumni</option>
                <option value="cessca_staff">CESSCA Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.first_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, first_name: e.target.value })}
                placeholder="First name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.last_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, last_name: e.target.value })}
                placeholder="Last name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.middle_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, middle_name: e.target.value })}
                placeholder="Middle name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.student_id}
                onChange={(e) => setCreateUserForm({ ...createUserForm, student_id: e.target.value })}
                placeholder="Student ID (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <select
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.course}
                onChange={(e) => setCreateUserForm({ ...createUserForm, course: e.target.value })}
              >
                <option value="">Select course (optional)</option>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                className="block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={createUserForm.contact_number}
                onChange={(e) => setCreateUserForm({ ...createUserForm, contact_number: e.target.value })}
                placeholder="Contact number (optional)"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateUserModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Admin;
