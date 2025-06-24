import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { FiCalendar, FiClock, FiDownload } from 'react-icons/fi';



const PunchHistory = ({ refreshTrigger }) => {
  const [state, setState] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    punchData: null,
    loading: false,
    isHovered: false
  });

  const employeeId = localStorage.getItem('employeeId');

  const formatDisplayTime = (timeString) => {
    if (!timeString) return '';
    try {
      return format(parseISO(timeString), 'hh:mm a');
    } catch {
      return timeString;
    }
  };

  const fetchPunchData = async (selectedDate) => {
    if (!selectedDate || !employeeId) return;
    
    setState(prev => ({ ...prev, loading: true }));
    try {
      const data = await AttendanceService.getPunchHistory(employeeId, selectedDate);
      setState(prev => ({
        ...prev,
        punchData: {
          ...data,
          punchInTimes: data.punchInTimes?.map(formatDisplayTime) || [],
          punchOutTimes: data.punchOutTimes?.map(formatDisplayTime) || []
        },
        loading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, punchData: null, loading: false }));
      console.error("Error fetching punch data:", error);
    }
  };

  const handleExport = async () => {
    try {
      const data = await AttendanceService.exportPunchData();
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `punch-records-${state.date}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  useEffect(() => {
    fetchPunchData(state.date);
  }, [state.date, refreshTrigger]);

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
          onMouseEnter={() => setState(prev => ({ ...prev, isHovered: true }))}
          onMouseLeave={() => setState(prev => ({ ...prev, isHovered: false }))}
          aria-label="Export punch records"
        >
          <FiDownload className="ph-export-icon" />
          {state.isHovered && <span className="ph-export-tooltip">Export Records</span>}
        </button>
      </div>

      <div className="ph-date-selector">
        <FiCalendar className="ph-calendar-icon" />
        <span className="ph-date-label">Select Date:</span>
        <input
          type="date"
          value={state.date}
          onChange={(e) => setState(prev => ({ ...prev, date: e.target.value }))}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="ph-date-input"
          aria-label="Select date to view punch history"
        />
      </div>

      {state.loading ? (
        <div className="ph-loading-state">
          <div className="ph-loading-spinner"></div>
          <p className="ph-loading-text">Loading your punch records...</p>
        </div>
      ) : state.punchData ? (
        <div className="ph-timeline-container">
          <div className="ph-timeline-header">
            <div className="ph-date-badge">
              <span className="ph-badge-day">
                {format(parseISO(state.punchData.date), 'EEEE')}
              </span>
              <span className="ph-badge-date">
                {format(parseISO(state.punchData.date), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="ph-count-display">
              <span className="ph-count-in">
                <span className="ph-count-number">{state.punchData.punchInCount}</span>
                <span className="ph-count-label">Punch Ins</span>
              </span>
              <span className="ph-count-out">
                <span className="ph-count-number">{state.punchData.punchOutCount}</span>
                <span className="ph-count-label">Punch Outs</span>
              </span>
            </div>
          </div>

          <div className="ph-timeline">
            {state.punchData.punchInTimes.map((time, idx) => (
              <div key={`in-${idx}`} className="ph-timeline-item ph-in">
                <div className="ph-timeline-marker ph-in"></div>
                <div className="ph-timeline-content">
                  <span className="ph-timeline-time">{time}</span>
                  <span className="ph-timeline-type">Punched In</span>
                </div>
              </div>
            ))}

            {state.punchData.punchOutTimes.map((time, idx) => (
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