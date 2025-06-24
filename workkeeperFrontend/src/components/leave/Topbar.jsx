import React, { useState } from 'react';
import { FiBell, FiMessageSquare, FiUser, FiSun, FiMoon, FiChevronDown, FiMenu } from 'react-icons/fi';

const Topbar = ({ toggleSidebar, darkMode, toggleDarkMode }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount] = useState(3); // This would normally come from state/props

  return (
    <div className={`topbar ${darkMode ? 'dark' : ''}`}>
      <div className="topbar-left">
        
        <div className="logo">
          <span className="logo-highlight">Leave</span>Manager
        </div>
      </div>
      
      <div className="topbar-right">
        <div className="topbar-actions">
          <button 
            className="theme-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            data-tooltip={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          <div className="icon-wrapper" data-tooltip="Notifications">
            <FiBell className="icon" />
            {unreadCount > 0 && (
              <span className="badge">{unreadCount}</span>
            )}
          </div>

          <div className="icon-wrapper" data-tooltip="Messages">
            <FiMessageSquare className="icon" />
          </div>
        </div>

        <div 
          className="profile-menu"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="profile-avatar">
            <FiUser className="user-icon" />
          </div>
          <div className="profile-info">
            <span className="profile-name">wrrcamens</span>
            <span className="profile-role">Admin</span>
          </div>
          <FiChevronDown className={`dropdown-arrow ${showDropdown ? 'open' : ''}`} />
          
          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <FiUser className="dropdown-icon" />
                <span>Profile</span>
              </div>
              <div className="dropdown-item">
                <FiSun className="dropdown-icon" />
                <span>Preferences</span>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item">
                <FiMoon className="dropdown-icon" />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;