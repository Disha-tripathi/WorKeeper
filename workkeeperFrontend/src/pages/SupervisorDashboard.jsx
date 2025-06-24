import React, { useEffect, useState } from 'react';

const SupervisorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('http://localhost:5116/supervisor/dashboard-overview', {
          method: 'GET',
          credentials: 'include', // important to send cookies if using cookie auth
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch dashboard data (${res.status})`);
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <p>Loading supervisor dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const {
    team,
    totalTeam,
    presentToday,
    absentToday,
    lateToday,
    onLeaveToday,
    upcomingLeaves,
    availability,
    recentAlerts,
  } = data;

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Supervisor Dashboard - {team}</h1>

      <section style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Team', value: totalTeam, color: '#555' },
          { label: 'Present Today', value: presentToday, color: '#4caf50' },
          { label: 'Absent Today', value: absentToday, color: '#f44336' },
          { label: 'Late Today', value: lateToday, color: '#ff9800' },
          { label: 'On Leave Today', value: onLeaveToday, color: '#2196f3' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: color,
              color: 'white',
              padding: '1rem',
              borderRadius: 8,
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
            }}
          >
            <div>{label}</div>
            <div style={{ fontSize: '2rem', marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Upcoming Leaves</h2>
        {upcomingLeaves.length === 0 ? (
          <p>No upcoming leaves</p>
        ) : (
          <ul>
            {upcomingLeaves.map(({ name, startDate, endDate, leaveType }, i) => (
              <li key={i}>
                {name}: {leaveType} from {new Date(startDate).toLocaleDateString()} to{' '}
                {new Date(endDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Team Availability Today</h2>
        {availability.length === 0 ? (
          <p>No attendance records for today</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>In Time</th>
                <th style={tableHeaderStyle}>Out Time</th>
              </tr>
            </thead>
            <tbody>
              {availability.map(({ name, Status, InTime, OutTime }, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={tableCellStyle}>{name}</td>
                  <td style={tableCellStyle}>{Status}</td>
                  <td style={tableCellStyle}>{InTime}</td>
                  <td style={tableCellStyle}>{OutTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Recent Alerts</h2>
        {recentAlerts.length === 0 ? (
          <p>No alerts</p>
        ) : (
          <ul>
            {recentAlerts.map(({ message, type, time }, i) => (
              <li key={i}>
                <strong>[{type}]</strong> {message} <em>({time})</em>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const tableHeaderStyle = {
  borderBottom: '2px solid #333',
  padding: '0.5rem',
  textAlign: 'left',
  backgroundColor: '#f4f4f4',
};

const tableCellStyle = {
  padding: '0.5rem',
};

export default SupervisorDashboard;
