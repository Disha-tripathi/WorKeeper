import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/common/Sidebar";
import {
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
  FaClock,
  FaUserCog,
  FaChartLine,
  FaBell,
  FaSun,
  FaMoon
} from "react-icons/fa";
import Loader from "../components/common/Loader1";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    lastLogin: "",
    role: "Administrator"
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5116/admin/dashboard-overview", {
          withCredentials: true,
        });
        setStats(res.data);
        if (res.data.adminProfile) setAdminProfile(res.data.adminProfile);
        if (res.data.notifications) setNotifications(res.data.notifications);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  if (loading) return (
    <div className={`admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar darkMode={darkMode} />
      <div className="dashboard-content">
        <div className="loading-spinner">
          <Loader />
        </div>
      </div>
    </div>
  );

  if (!stats) return (
    <div className={`admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar darkMode={darkMode} />
      <div className="dashboard-content">
        <div className="error-message">
          <FaTimesCircle className="error-icon" />
          <h3>Failed to load dashboard data</h3>
          <p>Please check your connection and try again</p>
          <button className={`retry-btn ${darkMode ? 'dark' : ''}`}>Retry</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <Sidebar darkMode={darkMode} />
      <div className="dashboard-content">

        <header className={`dashboard-header ${darkMode ? 'dark' : ''}`}>
          <div className="header-left">
            <h1>
              <FaChartLine className="header-icon" />
              Admin Dashboard
            </h1>
            <p className="welcome-message">Welcome back, {adminProfile.name}</p>
          </div>
          <div className="header-right">
            <button 
              className={`theme-toggle ${darkMode ? 'dark' : ''}`}
              onClick={toggleTheme}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            {/* <div className="notification-bell">
              <FaBell />
              {notifications.some(n => !n.read) && <span className="notification-badge"></span>}
            </div> */}
            <div className="admin-profile">
              <div className="profile-info">
                <p className="admin-name">{adminProfile.name}</p>
                <p className="admin-role">{adminProfile.role}</p>
              </div>
              <div className={`profile-avatar ${darkMode ? 'dark' : ''}`}>
                <FaUserCog />
              </div>
            </div>
          </div>
        </header>

        <section className="stats-overview">
          <div className={`section-header ${darkMode ? 'dark' : ''}`}>
            <h2>Key Metrics</h2>
            <div className="time-filter">
              <select className={darkMode ? 'dark' : ''}>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className={`dashboard-card ${darkMode ? 'dark' : ''}`}>
              <div className={`card-icon blue ${darkMode ? 'dark' : ''}`}>
                <FaUsers />
              </div>
              <div className="card-content">
                <h3>Total Employees</h3>
                <p className="card-value">{stats.totalEmployees}</p>
                {stats.employeeChange && (
                  <p className={`card-change ${stats.employeeChange >= 0 ? 'positive' : 'negative'}`}>
                    {stats.employeeChange >= 0 ? '+' : ''}{stats.employeeChange}% from last month
                  </p>
                )}
              </div>
            </div>

            <div className={`dashboard-card ${darkMode ? 'dark' : ''}`}>
              <div className={`card-icon green ${darkMode ? 'dark' : ''}`}>
                <FaCheckCircle />
              </div>
              <div className="card-content">
                <h3>Present Today</h3>
                <p className="card-value">{stats.presentToday}</p>
                {stats.presentChange && (
                  <p className={`card-change ${stats.presentChange >= 0 ? 'positive' : 'negative'}`}>
                    {stats.presentChange >= 0 ? '+' : ''}{stats.presentChange} from yesterday
                  </p>
                )}
              </div>
            </div>

            <div className={`dashboard-card ${darkMode ? 'dark' : ''}`}>
              <div className={`card-icon red ${darkMode ? 'dark' : ''}`}>
                <FaTimesCircle />
              </div>
              <div className="card-content">
                <h3>Absent Today</h3>
                <p className="card-value">{stats.absentToday}</p>
                {stats.absentChange && (
                  <p className={`card-change ${stats.absentChange >= 0 ? 'negative' : 'positive'}`}>
                    {stats.absentChange >= 0 ? '+' : ''}{stats.absentChange} from yesterday
                  </p>
                )}
              </div>
            </div>

            <div className={`dashboard-card ${darkMode ? 'dark' : ''}`}>
              <div className={`card-icon orange ${darkMode ? 'dark' : ''}`}>
                <FaClipboardList />
              </div>
              <div className="card-content">
                <h3>Pending Leaves</h3>
                <p className="card-value">{stats.pendingLeaves}</p>
                {stats.newLeavesToday && (
                  <p className="card-change neutral">{stats.newLeavesToday} new today</p>
                )}
              </div>
            </div>

            <div className={`dashboard-card ${darkMode ? 'dark' : ''}`}>
              <div className={`card-icon purple ${darkMode ? 'dark' : ''}`}>
                <FaClock />
              </div>
              <div className="card-content">
                <h3>Upcoming Shifts</h3>
                <p className="card-value">{stats.upcomingShifts}</p>
                <p className="card-change neutral">View schedule</p>
              </div>
            </div>
          </div>
        </section>

        <section className={`admin-info ${darkMode ? 'dark' : ''}`}>
          <div className={`admin-info-card ${darkMode ? 'dark' : ''}`}>
            <h3>Admin Information</h3>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{adminProfile.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role:</span>
              <span className="info-value">{adminProfile.role}</span>
            </div>
            <div className="info-row">
              <span className="info-label">System Status:</span>
              <span className="info-value positive">All systems operational</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDash