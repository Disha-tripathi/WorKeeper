import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import { FaBell, FaCheckCircle, FaTimesCircle, FaSun, FaMoon } from "react-icons/fa";
import Sidebar from "./Sidebar";
import "./Alerts.css";
// import { useTheme } from "../components/common/ThemeContext";

function Alerts() {
   const [darkTheme, setDarkTheme] = useState(() => {
      // Check localStorage for theme preference, default to false (light theme)
      return localStorage.getItem('darkTheme') === 'true';
    });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get("/alerts/my");
      setAlerts(response.data);
      const unread = response.data.filter(a => !a.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/alerts/mark-read/${id}`);
      setAlerts(prev =>
        prev.map(alert => alert.id === id ? { ...alert, isRead: true } : alert)
      );
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error("Failed to mark alert as read", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

      useEffect(() => {
      localStorage.setItem('darkTheme', darkTheme);
      document.body.classList.toggle('dark', darkTheme);
    }, [darkTheme]);
    const toggleTheme = () => setDarkTheme(prev => !prev);

  return (
    <div className={`alerts-container ${darkTheme ? 'dark-theme' : ''}`}>
      <Sidebar unreadCount={unreadCount} darkMode={darkTheme} />
      
      <div className="alerts-content">
        <div className="alerts-header">
          <div className="alerts-title-group">
            <FaBell className="alerts-icon" />
            <h1>Notifications</h1>
          </div>
          <button 
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={darkTheme ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkTheme ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner"></div>
        ) : alerts.length === 0 ? (
          <div className="empty-alerts">
            <FaTimesCircle className="empty-icon" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div className="alert-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.isRead ? "read" : "unread"}`}>
                <div className="alert-header">
                  <span className="alert-type">{alert.type}</span>
                  <span className="alert-time">{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
                <p className="alert-message">{alert.message}</p>
                {!alert.isRead && (
                  <button 
                    className="mark-read-btn" 
                    onClick={() => markAsRead(alert.id)}
                  >
                    <FaCheckCircle /> Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Alerts;