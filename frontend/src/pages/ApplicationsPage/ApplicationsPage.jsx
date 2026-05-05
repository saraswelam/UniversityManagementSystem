import { useEffect, useState } from 'react';
import { applicationsApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './ApplicationsPage.css';

function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await applicationsApi.getAll('pending');
      setApplications(data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading applications...</div>;

  return (
    <div className="applications-page">
      <div className="page-header">
        <h2>Pending Applications</h2>
      </div>

      <div className="applications-list">
        {applications.length > 0 ? (
          applications.map((application) => (
            <button
              key={application._id}
              className="application-card"
              onClick={() => setSelectedApplication(application)}
              type="button"
            >
              <div className="application-header">
                <span className="application-name">{application.name}</span>
                <span className="application-date">
                  {application.submittedAt
                    ? new Date(application.submittedAt).toLocaleDateString()
                    : ''}
                </span>
              </div>
              <div className="application-meta">
                <span>National ID: {application.nationalId}</span>
                <span>High School: {application.highSchool}</span>
              </div>
            </button>
          ))
        ) : (
          <p className="empty-message">No pending applications found.</p>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        title="Application Details"
      >
        {selectedApplication && (
          <div className="application-detail">
            <p><strong>Name:</strong> {selectedApplication.name}</p>
            <p><strong>National ID:</strong> {selectedApplication.nationalId}</p>
            <p><strong>High School:</strong> {selectedApplication.highSchool}</p>
            <p><strong>High School Grade:</strong> {selectedApplication.highSchoolGrade}</p>
            <p>
              <strong>Submitted:</strong>{' '}
              {selectedApplication.submittedAt
                ? new Date(selectedApplication.submittedAt).toLocaleString()
                : ''}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ApplicationsPage;
