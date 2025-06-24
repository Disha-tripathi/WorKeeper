import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FiPlus, FiX, FiCalendar, FiEdit2 } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../api/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import '../../styles/LeaveCards.css';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const LeaveCards = () => {
  const { user, loading: authLoading } = useAuth();
  const [leaveData, setLeaveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    note: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading || !user?.employeeId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch leave balance
        const balanceRes = await fetch(`http://localhost:5116/leave/balance`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!balanceRes.ok) throw new Error('Failed to fetch leave balance');
        const balanceData = await balanceRes.json();
        setLeaveData(balanceData);

        // Fetch leave types
        const typesRes = await axiosInstance.get('/leave/leave-types');
        const typesWithIds = typesRes.data.map((type, index) => ({
          ...type,
          id: index + 1
        }));
        setLeaveTypes(typesWithIds);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user]);

  const getChartData = (remaining, taken, total) => {
    const isEmpty = remaining === 0 && taken === 0;
    
    return {
      datasets: [{
        data: isEmpty ? [1] : [remaining, taken, total - (remaining + taken)],
        backgroundColor: isEmpty 
          ? ['#E2E8F0'] 
          : ['#4CAF50', '#F44336', '#F5F5F5'],
        borderWidth: 0,
        borderRadius: 5,
        spacing: 2
      }]
    };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.leaveTypeId) newErrors.leaveTypeId = 'Leave type is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.note || formData.note.trim().length < 10) newErrors.note = 'Please provide a detailed reason (min 10 chars)';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) {
      alert("Employee ID not found. Please login again.");
      return;
    }

    setSubmitting(true);

    const payload = {
      employeeId: parseInt(employeeId),
      leaveTypeId: parseInt(formData.leaveTypeId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      note: formData.note
    };

    try {
      await axiosInstance.post('/leave/apply', payload);
      setSuccess(true);
      setTimeout(() => {
        setFormData({
          leaveTypeId: '',
          startDate: '',
          endDate: '',
          note: ''
        });
        setSuccess(false);
        setShowModal(false);
      }, 2000);
    } catch (error) {
      console.error('Error applying leave:', error);
      alert(error.response?.data || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return <Loader message="Loading leave data..." />;
  }

  return (
    <div className="leave-management-container">
      <div className="leave-management-header">
        <div className="header-content">
          <h1 className="leave-management-title">Leave Management</h1>
          <p className="leave-management-subtitle">Track and manage your leave balances</p>
        </div>
        <button
          className="request-leave-button"
          onClick={() => setShowModal(true)}
        >
          <FiPlus className="button-icon" />
          <span>Request Leave</span>
        </button>
      </div>

      <div className="leave-cards-grid">
        {leaveData.map((leave, index) => {
          const isEmpty = leave.remaining === 0 && leave.taken === 0;
          const total = leave.total || (leave.remaining + leave.taken + 5);
          
          return (
            <div
              key={index}
              className={`leave-card ${leave.isOverused ? 'overused' : ''} ${isEmpty ? 'empty-leave' : ''}`}
            >
              <div className="leave-card-content">
                <div className="leave-chart-container">
                  <Doughnut 
                    data={getChartData(leave.remaining, leave.taken, total)}
                    options={{
                      cutout: '70%',
                      rotation: -90,
                      circumference: 360,
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                      }
                    }}
                  />
                  <div className="leave-count">
                    <span>{leave.remaining || leave.taken || 0}</span>
                    <small>days</small>
                  </div>
                </div>
                <div className="leave-info">
                  <h3 className="leave-type">{leave.leaveType}</h3>
                  <div className="leave-stats">
                    <div className="stat remaining-stat">
                      <span className="stat-value">{leave.remaining}</span>
                      <span className="stat-label">remaining</span>
                    </div>
                    <div className="stat taken-stat">
                      <span className="stat-value">{leave.taken}</span>
                      <span className="stat-label">taken</span>
                    </div>
                  </div>
                </div>
              </div>
              {leave.isOverused && (
                <div className="leave-overused-badge">Over Limit</div>
              )}
              {isEmpty && (
                <div className="empty-leave-badge">New</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Implementation */}
      {showModal && (
        <div className="modal-overlay">
          <div className="leave-modal">
            <div className="modal-header">
              <h2>Apply for Leave</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-content">
              {success ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h3>Leave Request Submitted!</h3>
                  <p>Your leave application has been successfully submitted.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className={`form-group ${errors.leaveTypeId ? 'error' : ''}`}>
                    <label>Leave Type</label>
                    <div className="input-with-icon">
                      <select
                        name="leaveTypeId"
                        value={formData.leaveTypeId}
                        onChange={handleChange}
                      >
                        <option value="">Select leave type</option>
                        {leaveTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.leaveTypeId && <span className="error-message">{errors.leaveTypeId}</span>}
                  </div>

                  <div className="date-range-group">
                    <div className={`form-group ${errors.startDate ? 'error' : ''}`}>
                      <label>Start Date</label>
                      <div className="input-with-icon">
                        <FiCalendar className="icon" />
                        <input
                          type="date"
                          className='date'
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                    </div>

                    <div className={`form-group ${errors.endDate ? 'error' : ''}`}>
                      <label>End Date</label>
                      <div className="input-with-icon">
                        <FiCalendar className="icon" />
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                    </div>
                  </div>

                  <div className={`form-group ${errors.note ? 'error' : ''}`}>
                    <label>Reason for Leave</label>
                    <div className="input-with-icon">
                      <FiEdit2 className="icon" />
                      <textarea
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        placeholder="Please provide details about your leave request..."
                        rows="4"
                      />
                    </div>
                    {errors.note && <span className="error-message">{errors.note}</span>}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCards;