// Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FaBars, FaTimes, FaClock, FaCalendarAlt, FaCog,
  FaSignOutAlt, FaBell, FaUser
} from "react-icons/fa";
import { useAuth } from "../../api/AuthContext"; // adjust path
import "./sidebar.css";

function Sidebar({ darkMode, unreadCount = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeItem, setActiveItem] = useState("");
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 🟢 Always call hooks unconditionally
  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  // 🟡 Safe to return null AFTER all hooks
  if (loading || !user) return null;

  console.log("🧾 Sidebar Role:", user?.role);

  // 🎯 Role-based menu
  let menuItems = [];

  if (user.role === "admin") {
    menuItems = [
      { path: "/admin-dashboard", icon: <FaUser />, label: "Dashboard" },
      { path: "/manage-employees", icon: <FaUser />, label: "Manage Employees" },
      { path: "/attendance-overview", icon: <FaClock />, label: "Attendance Logs" },
      { path: "/edit-attendance", icon: <FaClock />, label: "Edit Attendance" },
      { path: "/shift-management", icon: <FaCalendarAlt />, label: "Shift Management" },
      { path: "/pending-leaves", icon: <FaCalendarAlt />, label: "Leave Management" },
      { path: "/alerts", icon: <FaBell />, label: "Notifications" },
      // { path: "/settings", icon: <FaCog />, label: "Settings" },
    ];
  } else if (user.role === "supervisor") {
    menuItems = [
      { path: "/supervisor-dashboard", icon: <FaUser />, label: "Dashboard" },
      { path: "/team-attendance", icon: <FaClock />, label: "Team Attendance" },
      { path: "/leave", icon: <FaCalendarAlt />, label: "Leave Approvals" },
      { path: "/team-availability", icon: <FaCalendarAlt />, label: "Team Availability" },
      { path: "/alerts", icon: <FaBell />, label: "Notifications" },
      // { path: "/settings", icon: <FaCog />, label: "Settings" },
    ];
  } else {
    menuItems = [
      { path: "/employee-dashboard", icon: <FaUser />, label: "Dashboard" },
      { path: "/attendance", icon: <FaClock />, label: "Attendance Tracker" },
      { path: "/leave", icon: <FaCalendarAlt />, label: "Leave Management" },
      { path: "/alerts", icon: <FaBell />, label: "Notifications" },
      // { path: "/settings", icon: <FaCog />, label: "Settings" },
    ];
  }

  return (
    <div className={`sidebar-container ${darkMode ? "dark-mode" : ""}`}>
      {!isVisible && (
        <div className="sidebar-toggle">
          <FaBars onClick={() => setIsVisible(true)} size={30} className="toggle-icon" />
        </div>
      )}

      <div className={`sidebar-panel ${isVisible ? "visible" : ""}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">WorkKeeper</h3>
          <FaTimes onClick={() => setIsVisible(false)} size={20} className="close-icon" />
        </div>

        <div className="sidebar-menu">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path} className={activeItem === item.path ? "active" : ""}>
                <Link
                  to={item.path}
                  className="menu-link"
                  onClick={() => setActiveItem(item.path)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">
                    {item.label}
                    {item.label === "Notifications" && unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}

            <li className="logout-item" onClick={logout}>
              <span className="menu-icon"><FaSignOutAlt /></span>
              <span className="menu-label">Logout</span>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">👤</div>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
