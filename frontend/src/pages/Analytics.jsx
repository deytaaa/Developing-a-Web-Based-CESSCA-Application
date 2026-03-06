import Layout from '../components/Layout';
import Card from '../components/Card';

const Analytics = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <Card>
          <p className="text-gray-600">
            View comprehensive analytics, statistics, and generate reports
          </p>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;
