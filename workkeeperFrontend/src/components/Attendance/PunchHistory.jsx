import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiCalendar, FiClock, FiDownload } from "react-icons/fi";

const PunchHistory = ({ refreshTrigger }) => {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [punchData, setPunchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const token = localStorage.getItem("token");
  const employeeId = localStorage.getItem("employeeId");

  const fetchPunchData = async (selectedDate) => {
    if (!selectedDate || !employeeId) return;
    
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5116/attendance/punchRecords/${employeeId}?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Process the response data
      const processedData = {
        ...res.data,
        // Format times properly
        punchInTimes: res.data.punchInTimes.map(time => formatTime(time)),
        punchOutTimes: res.data.punchOutTimes.map(time => formatTime(time))
      };
      
      setPunchData(processedData);
    } catch (err) {
      console.error("Error fetching punch data:", err);
      setPunchData(null);
    } finally {
      setLoading(false);
    }
  };

  // Simple reliable time formatter
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString; // Return original if invalid
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeString; // Return original if formatting fails
    }
  };

  const handleExport = () => {
    alert("Exporting punch data...");
  };

  // Automatic refresh when either date or refreshTrigger changes
  useEffect(() => {
    fetchPunchData(date);
  }, [date, refreshTrigger]);

  return (
    <div className="ph-container">
      <div className="ph-header">
        <div className="ph-header-content">
          <FiClock className="ph-header-icon" />
          <h3 className="ph-title">Punch Timeline</h3>
        </div>
        <button 
          className="ph-export-btn"
          onClick={handleExport}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <FiDownload className="ph-export-icon" />
          {isHovered && <span className="ph-export-tooltip">Export Records</span>}
        </button>
      </div>

      <div className="ph-date-selector">
        <FiCalendar className="ph-calendar-icon" />
        <span className="ph-date-label">Select Date:</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="ph-date-input"
        />
      </div>

      {loading ? (
        <div className="ph-loading-state">
          <div className="ph-loading-spinner"></div>
          <p className="ph-loading-text">Loading your punch records...</p>
        </div>
      ) : punchData ? (
        <div className="ph-timeline-container">
          <div className="ph-timeline-header">
            <div className="ph-date-badge">
              <span className="ph-badge-day">
                {new Date(punchData.date).toLocaleString('default', { weekday: 'long' })}
              </span>
              <span className="ph-badge-date">
                {new Date(punchData.date).toLocaleDateString()}
              </span>
            </div>
            <div className="ph-count-display">
              <span className="ph-count-in">
                <span className="ph-count-number">{punchData.punchInCount}</span>
                <span className="ph-count-label">Punch Ins</span>
              </span>
              <span className="ph-count-out">
                <span className="ph-count-number">{punchData.punchOutCount}</span>
                <span className="ph-count-label">Punch Outs</span>
              </span>
            </div>
          </div>

          <div className="ph-timeline">
            {punchData.punchInTimes.map((time, idx) => (
              <div key={`in-${idx}`} className="ph-timeline-item ph-in">
                <div className="ph-timeline-marker ph-in"></div>
                <div className="ph-timeline-content">
                  <span className="ph-timeline-time">{time}</span>
                  <span className="ph-timeline-type">Punched In</span>
                </div>
              </div>
            ))}

            {punchData.punchOutTimes.map((time, idx) => (
              <div key={`out-${idx}`} className="ph-timeline-item ph-out">
                <div className="ph-timeline-marker ph-out"></div>
                <div className="ph-timeline-content">
                  <span className="ph-timeline-time">{time}</span>
                  <span className="ph-timeline-type">Punched Out</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ph-empty-state">
          <div className="ph-empty-icon">📅</div>
          <p className="ph-empty-text">No records found for this date</p>
        </div>
      )}
    </div>
  );
};

export default PunchHistory;