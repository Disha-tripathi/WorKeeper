import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUmbrellaBeach, 
  FaCalendarDay,
  FaFileExport,
  FaUserClock,
  FaEdit,
  FaTrashAlt,
  FaSync,
  FaMoon,
  FaSun
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/common/Sidebar";
import useAttendance from "../js_file/useAttendance";
import MarkAttendance from "../components/Attendance/MarkAttendance";
import PunchHistory from "../components/Attendance/PunchHistory";
import EmployeeDaySummary from "../components/Attendance/EmployeeDaySummary";
import EditAttendanceModal from "../components/Attendance/EditAttendanceModal";
import { useTheme } from '../components/common/Theme';
import "../styles/attendance.css";
import Loader from "../components/common/Loader";
import { Colors } from "chart.js";

function Attendance() {
  const [daySummary, setDaySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectRecord, setSelectedRecord] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [punches, setPunches] = useState([]);
  const [darkTheme, setDarkTheme] = useState(() => {
    // Check localStorage for theme preference, default to false (light theme)
    return localStorage.getItem('darkTheme') === 'true';
  });

  // Apply theme class to body element
  useEffect(() => {
    if (darkTheme) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
    // Save preference to localStorage
    localStorage.setItem('darkTheme', darkTheme);
  }, [darkTheme]);

    useEffect(() => {
      localStorage.setItem('darkTheme', darkTheme);
      document.body.classList.toggle('dark', darkTheme);
    }, [darkTheme]);
const toggleTheme = () => setDarkTheme(prev => !prev);

  const {
    attendanceData,
    error,
    loading,
    selectedRecord,
    showDetails,

    getSummary,
    setShowDetails,
    tileClassName,
    formatDate,
    handleDateClick,
    refreshAttendanceData,
    exportPunchData,
    deleteRecord
  } = useAttendance(selectedDate);

  useEffect(() => {
    refreshAttendanceData();
  }, [selectedDate, refreshCounter]);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? '' 
        : date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  const getIconForStatus = (status) => {
    switch (status) {
    case "Present": return <FaCheckCircle className="status-icon present" />;
    case "Absent": return <FaTimesCircle className="status-icon absent" />;
    case "Holiday": return <FaUmbrellaBeach className="status-icon holiday" />;
    case "Weekend": return <FaCalendarDay className="status-icon weekend" />;
      default: return null;
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (datetimeString) => {
    if (!datetimeString) return 'N/A';

    try {
      const date = new Date(datetimeString);

      if (isNaN(date.getTime())) {
        // console.warn('Invalid date:', datetimeString);
        return 'Invalid time';
      }

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('Time formatting error:', e);
      return 'Invalid time';
    }
  };

  const renderTime = (timeString) => {
    if (!timeString) return 'Not recorded';
    
    const formattedTime = formatTime(timeString);
    if (!formattedTime) {
      console.warn('Failed to format time:', timeString);
      return 'Invalid time format';
    }
    return formattedTime;
  };

  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/Login');
  };

  const handlePunchSuccess = async () => {
    try {
      setIsRefreshing(true);
      await refreshAttendanceData();
      setRefreshCounter(prev => prev + 1);
      toast.success("Punch recorded successfully!");
    } catch (err) {
      console.error('Error refreshing data:', err);
      toast.error("Failed to update attendance data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEdit = (record) => {
  console.log("Editing record:", record);
  console.log("Final ID:", record.id);
  console.log(Object.keys(record))

  let date = record.date;
  if (!date && record.punchIn) {
    date = record.punchIn.split('T')[0]; // fallback to punchIn date
  }

  const id = record.Id || record.id || record._id || record.attendanceId || record.attId || record.attendance_id;

  // 🔍 Move console logs above the check
  console.log("Final ID:", id);
  console.log("Final Date:", date);

  if (!id || !date) {
    alert('Cannot edit this record: missing id or date');
    return;
  }

  setRecordToEdit({
    ...record,
    id,
    date,
    punchIn: record.punchIn || record.punchInDateTime || null,
    punchOut: record.punchOut || record.punchOutDateTime || null
  });

  setEditModalOpen(true);
};




  const handleExport = async () => {
  if (window.confirm('Are you sure you want to export this record?')) {
    try {
      setIsRefreshing(true);
      await exportPunchData();
      toast.success("Export completed successfully!");
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }
  };

const handleViewSummary = () => {
  const dateToUse = selectRecord?.date
    ? new Date(selectRecord.date)
    : new Date(); // fallback to today

  setSelectedRecord((prev) => ({
    ...(prev || {}),
    date: dateToUse.toISOString().split('T')[0],
  }));

  if (!selectRecord?.date) {
    toast.info("Showing summary for today (no record selected)");
  }

  setShowSummary(true);
};


  useEffect(() => {
    if (selectedRecord) {
      console.log('Selected Record Data:', {
        ...selectedRecord,
        punchInFormatted: formatTime(selectedRecord.punchIn),
        punchOutFormatted: formatTime(selectedRecord.punchOut)
      });
    }
  }, [selectedRecord]);

//   useEffect(() => {
//   const loadAll = async () => {
//     try {
//       const [day, month, year] = await Promise.all([
//         getSummary('day', selectedDate),
//         getSummary('month', selectedDate),
//         getSummary('year', selectedDate),
//       ]);
//       setDaily(day);
//       setMonthly(month);
//       setYearly(year);
//     } catch (err) {
//       console.error('Summary load failed:', err);
//     }
//   };
//   loadAll();
// }, [selectedDate]);

  return (
    <div className={`attendance-container ${darkTheme ? 'dark-theme' : 'light-theme'}`}>
      <div className="sidebar">
        <Sidebar darkMode={darkTheme}/>
      </div>
      
      <div className="attendance-content">
        <header className="attendance-header">
          <div className="header-top">
            <h1>Attendance Dashboard</h1>
                <button 
                    onClick={toggleTheme} 
                    className="attendance-theme-toggle"
                    aria-label={darkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
                  >
                    {darkTheme ? <FaSun /> : <FaMoon />}
                  </button>
          </div>
          <div className="current-date-display">
            {formatDisplayDate(selectedDate)}
            {isRefreshing && <span className="refreshing-indicator">Refreshing...</span>}
          </div>
          <p>Track your daily attendance and working hours</p>
        </header>

        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={handleClick} className="retry-button">Retry</button>
          </div>
        ) : loading ? (
          <Loader />
        ) : (
          <div className="attendance-grid">
            <div className="calendar-section">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileClassName={tileClassName}
                onClickDay={(date) => {
                  handleDateClick(date);
                  setShowDetails(true);
                }}
                tileContent={({ date }) => {
                  const record = attendanceData.find(r => r.date === formatDate(date));
                  const todayClass = isToday(date) ? "today" : "";
                  
                  return (
                    <div className={`calendar-tile ${todayClass}`}>
                      {record && getIconForStatus(record.status)}
                      <div className="calendar-tooltip">
                        {isToday(date) && <span className="today-marker">Today</span>}
                        {record && `Status: ${record.status}\n`}
                        {record?.punchIn && `In: ${renderTime(record.punchIn)}\n`}
                        {record?.punchOut && `Out: ${renderTime(record.punchOut)}`}
                      </div>
                    </div>
                  );
                }}
              />
              
              <div className="legend-container">
                {["Present", "Absent", "Holiday", "Weekend"].map(status => (
                  <div key={status} className="legend-item">
                    <span className={`legend-color ${status.toLowerCase()}`}></span>
                    <span>{status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="action-panel">
              <div className="action-card">
                <h2>Quick Actions</h2>
                <MarkAttendance onPunchSuccess={handlePunchSuccess} />
                
                <div className="action-buttons">
                  <button 
                    onClick={handleExport} 
                    className="action-btn export"
                    disabled={isRefreshing}
                  >
                    <FaFileExport /> Export Data
                  </button>
                  <button 
                    onClick={handleViewSummary}
                    className="action-btn summary"
                    // disabled={!selectedRecord}
                    title={!selectedRecord ? "Select a record first" : ""}
                  >
                    <FaUserClock /> View Summary
                  </button>

                </div>
              </div>

              {showDetails && selectedRecord && (
                <div className="daily-details-wrapper">
                  <div className="daily-details-card">
                    <div className="daily-details-header">
                      <h4>Attendance Details for {formatDisplayDate(selectedRecord.date)}</h4>
                      <div className="detail-actions">
                        {/* <button 
                          className="selected-btn"
                          onClick={() => handleEdit(selectedRecord)}
                          onMouseEnter={() => setHoveredButton('Edit')}
                          onMouseLeave={() => setHoveredButton(null)}
                          disabled={isRefreshing}
                        >
                          <FaEdit className="selected-icon" />
                          {hoveredButton === 'Edit' && <span className="selected-tooltip">Edit</span>}
                        </button> */}
                        {/* <button 
                          className="selected-btn"
                          onClick={() => handleDelete(selectedRecord.id)}
                          onMouseEnter={() => setHoveredButton('Delete')}
                          onMouseLeave={() => setHoveredButton(null)}
                          disabled={isRefreshing}
                        >
                          <FaTrashAlt className="selected-icon" />
                          {hoveredButton === 'Delete' && <span className="selected-tooltip">Delete</span>}
                        </button> */}
                        <button 
                          onClick={() => setShowDetails(false)} 
                          className="close-button"
                          aria-label="Close details"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="daily-details-body">
                      <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">
                          <span className={`status-badge ${selectedRecord.status.toLowerCase() || 'unknown'} `}>
                            {selectedRecord.status}
                          </span>
                        </span>
                      </div>

                      {!selectedRecord.isFuture ? (
                        <>
                          <div className="detail-row">
                            <span className="detail-label">Punch In:</span>
                            <span className="detail-value">
                              {selectedRecord.punchIn ? (
                                <>
                                  <span className="punch-time punch-in">
                                    {renderTime(selectedRecord.punchInDateTime)}
                                  </span>
                                  {selectedRecord.punchInEditedBy && (
                                    <span className="edit-info">
                                      (Edited by {selectedRecord.punchInEditedBy})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="no-record">Not recorded</span>
                              )}
                            </span>
                          </div>

                          <div className="detail-row">
                            <span className="detail-label">Punch Out:</span>
                            <span className="detail-value">
                              {selectedRecord.punchOut ? (
                                <>
                                  <span className="punch-time punch-out">
                                    {renderTime(selectedRecord.punchOutDateTime)}
                                  </span>
                                  {selectedRecord.punchOutEditedBy && (
                                    <span className="edit-info">
                                      (Edited by {selectedRecord.punchOutEditedBy})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="no-record">Not recorded</span>
                              )}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="detail-row future-info">
                          <p>This date is in the future. No attendance data available.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="punchRecords">
              <div className="punch-history-header">
                <h2>Punch History</h2>
              </div>
              <PunchHistory 
                key={`punch-history-${refreshCounter}`}
                refreshTrigger={refreshCounter}
              />
            </div>
          </div>
        )}

        {/* {editModalOpen && (
          <EditAttendanceModal
            record={recordToEdit}
            onClose={() => {
              setEditModalOpen(false);
            }}
            onSuccess={handleEditSuccess}
          />
        )} */}
{showSummary && (
  <EmployeeDaySummary
    selectedDate={
      selectedRecord?.date
        ? new Date(selectedRecord.date)
        : new Date() // fallback to today
    }
    onClose={() => setShowSummary(false)}
  />
)}


      </div>
    </div>
  );
}

export default Attendance;