import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/common/Sidebar";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faEdit, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import "../styles/EditAttendance.css";

const EditAttendance = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5116/admin/employees", {
        withCredentials: true,
      });
      setEmployees(res.data);
    } catch (error) {
      toast.error("Failed to fetch employees");
      console.error(error);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5116/admin/attendance-logs", {
        params: { page, pageSize },
        withCredentials: true,
      });
      setRecords(res.data.records);
      setTotalCount(res.data.totalCount);
    } catch (error) {
      toast.error("Failed to fetch attendance records");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [page]);

  const openEditModal = (record) => {
    setEditing({
      id: record.id || record.attendanceId,
    });

    setForm({
      status: record.status || "",
      inTime: record.inTime ? formatDateTimeForInput(record.inTime) : "",
      outTime: record.outTime ? formatDateTimeForInput(record.outTime) : "",
    });

    setModalOpen(true);
  };

  const formatDateTimeForInput = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleSave = async () => {
    try {
      const payload = {
        status: form.status,
        inTime: form.inTime ? new Date(form.inTime).toISOString() : null,
        outTime: form.outTime ? new Date(form.outTime).toISOString() : null,
      };

      await axios.put(
        `http://localhost:5116/admin/edit-attendance/${editing.id}`,
        payload,
        { withCredentials: true }
      );

      toast.success("Attendance updated successfully");
      setModalOpen(false);
      fetchRecords();
    } catch (err) {
      console.error("Error saving attendance", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to update attendance");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Present': return 'status-present';
      case 'Absent': return 'status-absent';
      case 'Holiday': return 'status-holiday';
      default: return '';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "--";
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="edit-attendance-container">
      <Sidebar />
      <div className="content-area">
        <div className="attendance-card">
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '24px' }}>
            ✏️ Edit Attendance
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Total Hours</th>
                    <th>Punch Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date?.split("T")[0]}</td>
                      <td>{record.employeeName}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{formatTime(record.inTime)}</td>
                      <td>{formatTime(record.outTime)}</td>
                      <td>{record.totalHours || "--"}</td>
                      <td>{record.punchStatus || "--"}</td>
                      <td>
                        <button 
                          className="action-button button-outline"
                          onClick={() => openEditModal(record)}
                        >
                          <FontAwesomeIcon icon={faEdit} style={{ marginRight: '8px' }} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination">
                <button 
                  className="action-button button-outline"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))} 
                  disabled={page === 1}
                >
                  ◀ Previous
                </button>
                <span style={{ color: 'var(--text-primary)' }}>
                  Page {page} of {totalPages}
                </span>
                <button 
                  className="action-button button-outline"
                  onClick={() => setPage((p) => p < totalPages ? p + 1 : p)} 
                  disabled={page >= totalPages}
                >
                  Next ▶
                </button>
              </div>
            </>
          )}
        </div>

        {/* Edit Modal */}
        {modalOpen && (
          <div className="attendance-modal">
            <div className="modal-content">
              <h3 className="modal-title">
                <FontAwesomeIcon icon={faEdit} style={{ marginRight: '10px' }} />
                Edit Attendance
              </h3>

              <div className="form-group">
                <label className="form-label">Status:</label>
                <select
                  className="form-control"
                  value={form.status || ""}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="">Select Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">In Time:</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.inTime || ""}
                  onChange={(e) => setForm({ ...form, inTime: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Out Time:</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.outTime || ""}
                  onChange={(e) => setForm({ ...form, outTime: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  className="action-button button-outline"
                  onClick={() => setModalOpen(false)}
                >
                  <FontAwesomeIcon icon={faTimes} style={{ marginRight: '8px' }} />
                  Cancel
                </button>
                <button 
                  className="action-button button-primary"
                  onClick={handleSave}
                >
                  <FontAwesomeIcon icon={faSave} style={{ marginRight: '8px' }} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button 
          className="action-button button-primary theme-toggle"
          onClick={toggleTheme}
        >
          <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
        </button>
      </div>
    </div>
  );
};

export default EditAttendance;