import React, { useEffect, useState } from 'react';

const LeaveRecordTable = () => {
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveRecords = async () => {
      try {
        const response = await fetch('http://localhost:5116/leave/leave-record', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leave records');
        }

        const data = await response.json();
        setLeaveRecords(data);
      } catch (error) {
        console.error('Error:', error);
        setLeaveRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRecords();
  }, []);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : '—';

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status-badge status-approved';
      case 'Rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge status-pending';
    }
  };

  if (loading) return (
    <div className="loading-state">
      <span className="loading-spinner"></span>
      Loading leave records...
    </div>
  );
  
  if (leaveRecords.length === 0) return (
    <div className="empty-state">
      No leave records found
    </div>
  );

  return (
    <div className="leave-records-container">
      <div className="leave-records-header">
        <h2 className="leave-records-title">Leave Records</h2>
      </div>
      
      <table className="leave-records-table">
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Date Range</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Applied On</th>
            <th>Approved On</th>
            <th>Approver</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {leaveRecords.map((record) => (
            <tr key={record.id}>
              <td>{record.leaveTypeName}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="date-cell">{formatDate(record.startDate)}</span>
                  <span style={{ color: '#cccccc' }}>→</span>
                  <span className="date-cell">{formatDate(record.endDate)}</span>
                </div>
              </td>
              <td>{record.totalDays} day{record.totalDays !== 1 ? 's' : ''}</td>
              <td>
                <span className={getStatusClass(record.status)}>
                  {record.status}
                </span>
              </td>
              <td className="date-cell">{formatDate(record.appliedOn)}</td>
              <td className="date-cell">{formatDate(record.approvedOn)}</td>
              <td>{record.approvedBy || '—'}</td>
              <td style={{ color: '#666666', minWidth: '150px' }}>
                {record.note || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveRecordTable;