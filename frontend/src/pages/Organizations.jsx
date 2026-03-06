import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { organizationService } from '../services/organizationService';
import { useAuth } from '../contexts/AuthContext';
import { FiSettings } from 'react-icons/fi';

const Organizations = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrganizations();
  }, [filter]);

  const loadOrganizations = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await organizationService.getAll(params);
      setOrganizations(response.organizations);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      academic: 'primary',
      cultural: 'success',
      sports: 'warning',
      social: 'info',
      special_interest: 'default',
    };
    return colors[type] || 'default';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Student Organizations</h1>
          {(user?.role === 'cessca_staff' || user?.role === 'admin') && (
            <Link to="/admin?tab=organizations">
              <Button variant="primary">
                <FiSettings className="mr-2" /> Manage Organizations
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner centered size="lg" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card 
                key={org.org_id} 
                className="hover:shadow-lg transition h-full flex flex-col"
                contentClassName="flex flex-col flex-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{org.org_acronym}</h3>
                    <p className="text-sm text-gray-600">{org.org_name}</p>
                  </div>
                  <Badge variant={getTypeColor(org.org_type)} className="ml-2 flex-shrink-0">
                    {org.org_type.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-3">{org.description}</p>

                <div className="flex-grow"></div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{org.member_count} members</span>
                  <span>{org.officer_count} officers</span>
                </div>

                <Link to={`/organizations/${org.org_id}`}>
                  <Button variant="primary" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Organizations;
