import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyticsService } from '../services/analyticsService';
import { FiUsers, FiAward, FiDownload, FiCalendar } from 'react-icons/fi';

const StatCard = ({ icon, iconBg, label, value, note }) => (
  <Card className="!p-0 overflow-hidden border-0 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
    <div className="relative h-full bg-gradient-to-br from-white via-white to-slate-50 p-6">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg} ring-1 ring-black/5 shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
        </div>
      </div>
    </div>
  </Card>
);

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.getDashboard();
        setDashboard(response.dashboard);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner centered size="lg" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-7 text-white shadow-[0_20px_50px_rgba(6,78,59,0.25)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(250,204,21,0.18),transparent_26%),radial-gradient(circle_at_85%_30%,rgba(34,197,94,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_22%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/90">Reports</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Analytics & Reports</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50/80 md:text-base">A cleaner snapshot of users, organizations, and current activity across the system.</p>
            </div>
            <Link
              to="/activities"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15"
            >
              <FiDownload className="h-4 w-4" />
              Export data
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            icon={<FiUsers className="h-6 w-6 text-emerald-600" />}
            iconBg="bg-emerald-100"
            label="Total Users"
            value={dashboard.userStats?.reduce((acc, stat) => acc + stat.count, 0) || 0}
            note="Across all roles and statuses"
          />
          <StatCard
            icon={<FiAward className="h-6 w-6 text-emerald-600" />}
            iconBg="bg-lime-100"
            label="Organizations"
            value={dashboard.organizations?.total || 0}
            note="Currently active groups"
          />
          <StatCard
            icon={<FiCalendar className="h-6 w-6 text-emerald-600" />}
            iconBg="bg-teal-100"
            label="Upcoming Events"
            value={dashboard.upcomingEvents?.length || 0}
            note="Scheduled and upcoming"
          />
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User Distribution */}
          <Card title="User Distribution by Role">
            <div className="space-y-3">
              {dashboard.userStats?.map((stat) => {
                const totalUsers = dashboard.userStats?.reduce((acc, item) => acc + item.count, 0) || 1;
                const width = Math.max((stat.count / totalUsers) * 100, 10);

                return (
                  <div key={`${stat.role}-${stat.status}`} className="space-y-2 rounded-xl border border-gray-100 bg-gradient-to-r from-white to-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {stat.role.replace('_', ' ')} <span className="text-slate-400">({stat.status})</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{stat.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-green-500" style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Activities */}
          <Card title="Upcoming Organization Activities">
            <div className="space-y-3">
              {dashboard.recentActivities?.slice(0, 10).map((activity) => (
                <div key={activity.activity_id} className="group flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gradient-to-r from-white to-slate-50 p-4 transition hover:border-emerald-200 hover:shadow-sm">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900">{activity.activity_title}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{activity.org_acronym}</span> • {activity.activity_type}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(activity.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                    {activity.status}
                  </span>
                </div>
              ))}
              {(!dashboard.recentActivities || dashboard.recentActivities.length === 0) && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-slate-500">
                  No recent activities
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
