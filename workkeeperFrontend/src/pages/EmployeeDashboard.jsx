// === FRONTEND: EmployeeDashboard.jsx ===
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FiClock, FiUsers, FiCalendar, FiUser, FiRefreshCw,
  FiLogIn, FiLogOut, FiActivity, FiTrendingUp, FiAward,
  FiMoon, FiSun
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid
} from 'recharts';
import Sidebar from '../components/common/Sidebar';
import '../styles/EmployeeDashboard.css';

const COLORS = ['#7c73e6', '#a5b4fc', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'];

const EmployeeDashboard = () => {
  const [darkTheme, setDarkTheme] = useState(() => {
    return localStorage.getItem('darkTheme') === 'true';
  });

  const [dashboardData, setDashboardData] = useState({
    fullName: '',
    employeeId: '',
    designation: '',
    department: '',
    team: '',
    avatarInitials: 'US',
    presence: {
      inTime: '',
      outTime: '',
      totalHours: '',
      mode: '',
      isHoliday: false,
      holidayName: '',
      isWeekend: false,
      status: 'present'
    },
    todayLeave: [],
    upcomingLeaves: [],
    yourTeam: [],
    kpis: {
      productivity: 0,
      attendance: 0,
      punctuality: 0
    }
  });

  const [weeklySummary, setWeeklySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [forgotPunchOutAlert, setForgotPunchOutAlert] = useState(false);

  // 🔄 Dark mode toggle setup
  useEffect(() => {
    localStorage.setItem('darkTheme', darkTheme);
    document.body.classList.toggle('dark', darkTheme);
  }, [darkTheme]);

  // ✅ Check if punch out is missed
  useEffect(() => {
    const checkPunchOut = async () => {
      try {
        const res = await axios.post(
          'http://localhost:5116/attendance/check-live-missed-punchout',
          {},
          { withCredentials: true }
        );
        if (res.data.alertCreated) {
          setForgotPunchOutAlert(true);
        }
      } catch (err) {
        console.error('Punch-out check failed', err);
      }
    };

    checkPunchOut();
  }, []);

  // ✅ Fetch dashboard
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get('http://localhost:5116/employee/dashboard', {
        withCredentials: true
      });

      const safeData = {
        fullName: res.data.fullName || 'Unknown User',
        employeeId: res.data.employeeId || '',
        designation: res.data.designation || '',
        department: res.data.department || '',
        team: res.data.team || '',
        avatarInitials: getInitials(res.data.fullName),
        presence: {
          inTime: res.data.presence?.inTime || '',
          outTime: res.data.presence?.outTime || '',
          totalHours: res.data.presence?.totalHours || '',
          mode: res.data.presence?.mode || '',
          isHoliday: res.data.presence?.isHoliday || false,
          holidayName: res.data.presence?.holidayName || '',
          isWeekend: res.data.presence?.isWeekend || false,
          status: res.data.presence?.status || 'present'
        },
        todayLeave: Array.isArray(res.data.todayLeave) ? res.data.todayLeave : [],
        upcomingLeaves: Array.isArray(res.data.upcomingLeaves) ? res.data.upcomingLeaves : [],
        yourTeam: Array.isArray(res.data.yourTeam) ? res.data.yourTeam : [],
        kpis: {
          productivity: res.data.kpis?.productivity || 0,
          attendance: res.data.kpis?.attendance || 0,
          punctuality: res.data.kpis?.punctuality || 0
        }
      };

      setDashboardData(safeData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch weekly summary
  const fetchWeeklySummary = async () => {
    try {
      const res = await axios.get('http://localhost:5116/employee/weekly-summary', {
        withCredentials: true
      });
      setWeeklySummary(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Weekly summary error:", err);
    }
  };

  // 📦 Fetch data on mount and every 5 minutes
  useEffect(() => {
    fetchDashboard();
    fetchWeeklySummary();

    const interval = setInterval(() => {
      fetchDashboard();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // 🛠 Utility: get initials
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'US';
    const initials = name.trim().split(' ').filter(n => n.length > 0).map(n => n[0]).join('');
    return initials.toUpperCase();
  };

  // 🛠 Utility: format time
  const formatTime = (timeString) => {
    if (!timeString || timeString === 'N/A') return '--:--';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  // 🎉 Holiday or weekend message
  const renderHolidayMessage = () => {
    const { isHoliday, holidayName, isWeekend } = dashboardData.presence;
    if (isHoliday) return <div className="holiday-message">🎉 Happy {holidayName || 'Holiday'}!</div>;
    if (isWeekend) return <div className="holiday-message">🎉 Enjoy your weekend!</div>;
    return null;
  };
  
  const getStatusColor = (status) => {
    if (!status) return '#94a3b8';
    switch(status.toLowerCase()) {
      case 'present': return 'rgb(67 185 16)';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      case 'on leave': return '#6366f1';
      default: return '#94a3b8';
    }
  };

  const pieData = (() => {
    const modeCount = weeklySummary.reduce((acc, item) => {
      if (item?.mode) {
        acc[item.mode] = (acc[item.mode] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.keys(modeCount).map((key) => ({ name: key, value: modeCount[key] }));
  })();

  const barData = [
    { name: 'Today', hours: parseFloat(dashboardData.presence.totalHours || 0) },
    { name: 'Expected', hours: 8.00 }
  ];

  const weeklyData = weeklySummary.map(day => ({
    day: day?.day || 'Unknown',
    hours: parseFloat(day?.totalHours || 0),
    mode: day?.mode || ''
  }));

  const kpiData = [
    { name: 'Productivity', value: dashboardData.kpis.productivity, icon: <FiTrendingUp /> },
    { name: 'Attendance', value: dashboardData.kpis.attendance, icon: <FiActivity /> },
    { name: 'Punctuality', value: dashboardData.kpis.punctuality, icon: <FiAward /> }
  ];

  if (loading) return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="dashboard-container">
      <Sidebar darkMode={darkTheme}/>
      <div className="error-state">
        <h3>⚠️ Dashboard Error</h3>
        <p>{error}</p>
        <button onClick={fetchDashboard} className="retry-btn">
          <FiRefreshCw /> Retry
        </button>
      </div>
    </div>
  );
  const toggleTheme = () => setDarkTheme(prev => !prev);


  return (
    <div className={`professional-dashboard ${darkTheme ? 'dark-theme' : ''}`}>
      <Sidebar darkMode={darkTheme} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="user-profile">
            <div className="avatar-circle">{dashboardData.avatarInitials}</div>
            <div className="user-info">
              <h1>{dashboardData.fullName}</h1>
              <p className="user-meta">
                {dashboardData.employeeId && <span>ID: {dashboardData.employeeId}</span>}
                {dashboardData.designation && <span>{dashboardData.designation}</span>}
                {dashboardData.department && <span>{dashboardData.department}</span>}
                {dashboardData.team && <span>{dashboardData.team}</span>}
              </p>
            </div>
          </div>
          
          <div className="header-controls">
            <button 
              onClick={toggleTheme} 
              className="theme-toggle"
              aria-label={darkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkTheme ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <span className="update-time">Last updated: {lastUpdated}</span>
            <button className="refresh-button" onClick={fetchDashboard}>
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </header>

        <div className="status-bar">
          <div className="status-indicator" style={{ backgroundColor: getStatusColor(dashboardData.presence.status) }}>
            {dashboardData.presence.status?.toUpperCase() || 'UNKNOWN'}
          </div>
          {renderHolidayMessage()}
          <div className="time-display">
            <span><FiLogIn /> {formatTime(dashboardData.presence.inTime)}</span>
            <span><FiLogOut /> {formatTime(dashboardData.presence.outTime)}</span>
            <span><FiClock /> {dashboardData.presence.totalHours || '0.00'} hrs</span>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`nav-item ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Team
          </button>
        </nav>

        <div className="content-area">
          {activeTab === 'overview' && (
            <>
              <div className="row">
                <div className="kpi-section">
                  <h2 className="section-title">Performance Metrics</h2>
                  <div className="kpi-container">
                    {kpiData.map((kpi, index) => (
                      <div key={index} className="kpi-item">
                        <div className="kpi-header">
                          {kpi.icon}
                          <span>{kpi.name}</span>
                        </div>
                        <div className="kpi-value">{kpi.value}%</div>
                        <div className="kpi-progress">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${kpi.value}%`, backgroundColor: COLORS[index] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="work-mode-section">
                  <h2 className="section-title">Work Mode Distribution</h2>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} days`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="leaves-section">
                <h2 className="section-title">Leave Status</h2>
                <div className="leaves-container">
                  <div className="today-leaves">
                    <h3>Today's Leave</h3>
                    {dashboardData.todayLeave.length > 0 ? (
                      <ul>
                        {dashboardData.todayLeave.map((leave, index) => (
                          <li key={index}>{leave}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-data">No leave scheduled for today</p>
                    )}
                  </div>
                  
                  <div className="upcoming-leaves">
                    <h3>Upcoming Leaves</h3>
                    {dashboardData.upcomingLeaves.length > 0 ? (
                      <ul>
                        {dashboardData.upcomingLeaves.map((leave, index) => (
                          <li key={index}>{leave}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-data">No upcoming leaves</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              <div className="chart-section">
                <h2 className="section-title">Weekly Hours Analysis</h2>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="comparison-section">
                <h2 className="section-title">Daily Hours Comparison</h2>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

            {activeTab === 'team' && (
              <div className="team-section">
                <h2 className="section-title">Team Members ({dashboardData.yourTeam.length})</h2>
                {dashboardData.yourTeam.length > 0 ? (
                  <div className="team-grid">
                    {dashboardData.yourTeam.map((memberName, index) => (
                      <div key={index} className="team-member">
                        <div className="member-avatar">{getInitials(memberName)}</div>
                        <div className="member-details">
                          <h3>{memberName}</h3>
                          <p>Team Member</p> {/* Default position since backend doesn't provide */}
                        </div>
                        <div className="member-status" style={{ color: '#10b981' }}>
                          Active
                        </div>
                      </div>
                    ))}
                    {forgotPunchOutAlert && (
                      <div className="alert-warning">
                        ⚠️ You forgot to punch out today. Please correct your attendance.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="no-data">No teammates found in your department</p>
                )}
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;