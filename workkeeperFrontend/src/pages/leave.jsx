import React, { useState, useEffect } from 'react';
import '../styles/leave.css';
// import Topbar from '../components/leave/Topbar';
import Loader from '../components/common/Loader1';
import Sidebar from '../components/common/Sidebar';
import LeaveCards from '../components/leave/LeaveCards';
import { FiSun, FiMoon } from 'react-icons/fi';
import TeamAvailability from '../components/leave/TeamAvailability';
// import LeaveCalendar from '../components/leave/LeaveCalendar';
import { useAuth } from '../api/AuthContext';
import PendingLeaves from '../components/leave/Pending';
import LeaveRecordTable from '../components/leave/LeaveRecordTable';

const LeaveManagement = () => {
  // ✅ Auth hook - must always be called
  const { user, loading } = useAuth();

  // ✅ Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Dark theme persisted in localStorage
  const [darkTheme, setDarkTheme] = useState(() => {
    // Check localStorage for theme preference, default to false (light theme)
    return localStorage.getItem('darkTheme') === 'true';
  });

  // ✅ Apply dark mode class and persist to localStorage
  useEffect(() => {
    localStorage.setItem('darkTheme', darkTheme);
    document.body.classList.toggle('dark', darkTheme);
  }, [darkTheme]);

  // ✅ Theme toggle handler
  const toggleTheme = () => setDarkTheme(prev => !prev);

  // 🐞 Debug print
  console.log("auth loading:", loading);
  console.log("auth user:", user);

  // ✅ Conditional render after all hooks
  if (loading) return <Loader />;
  if (!user) return <p>Not logged in</p>;

  const employeeId = user.id;

  return (
    <>
      <Sidebar darkMode={darkTheme} />

      <div className={`leave-app-container ${sidebarOpen ? 'sidebar-open' : ''} ${darkTheme ? 'dark-theme' : ''}`}>
        <div className="leave-main-content">
          <div className="leave-page-content">

            {/* 🌗 Theme toggle button */}
            <button 
              onClick={toggleTheme} 
              className="leave-theme-toggle"
              aria-label={darkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {darkTheme ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* 📊 Leave Cards + Team */}
            <div className="leave-one">
              <LeaveCards employeeId={employeeId} />
              <TeamAvailability employeeId={employeeId} />
            </div>
            {/* <PendingLeaves /> */}

            {/* 📄 Leave Records */}
            <LeaveRecordTable employeeId={employeeId} />

            {/* 🗓️ Leave calendar (optional) */}
            {/* <LeaveCalendar employeeId={employeeId} year="2025" month="06" /> */}

          </div>
        </div>
      </div>
    </>
  );
};

export default LeaveManagement;
