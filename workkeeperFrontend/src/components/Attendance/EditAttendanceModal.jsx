import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

const EditAttendanceModal = ({ record, onClose }) => {
  const [state, setState] = useState({
    punchIn: record?.punchIn || '',
    punchOut: record?.punchOut || '',
    loading: false,
    error: null,
  });

  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';
    try {
      // If it's a time string like "08:45", just return it
      if (timeString.length <= 5 && timeString.includes(':')) return timeString;
      return format(parseISO(timeString), 'HH:mm');
    } catch {
      return timeString;
    }
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const saveAttendance = async (id, updates) => {
    try {
      const response = await fetch(`http://localhost:5116/attendance/update/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inTime: new Date(state.punchIn).toISOString(),  // or state.inTime
          outTime: new Date(state.punchOut).toISOString() // or state.outTime
          }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('Update Success:', result);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!record?.id || !record?.date) {
      setState((prev) => ({ ...prev, error: '⚠️ Missing record ID or date' }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Construct ISO strings with date and time
      const punchInISO = state.punchIn ? `${record.date}T${state.punchIn}:00` : null;
      const punchOutISO = state.punchOut ? `${record.date}T${state.punchOut}:00` : null;

      const updates = {};
      if (punchInISO) updates.InTime = punchInISO;
      if (punchOutISO) updates.OutTime = punchOutISO;

      await saveAttendance(record.id, updates);
      onClose(); // close modal
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Edit Attendance Record</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="punchIn">Punch In Time</label>
            <input
              type="time"
              id="punchIn"
              name="punchIn"
              value={formatTimeForInput(state.punchIn)}
              onChange={handleTimeChange}
              className="time-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="punchOut">Punch Out Time</label>
            <input
              type="time"
              id="punchOut"
              name="punchOut"
              value={formatTimeForInput(state.punchOut)}
              onChange={handleTimeChange}
              className="time-input"
            />
          </div>

          {state.error && <div className="error-message">{state.error}</div>}

          <div className="modal-actions">
            <button type="submit" disabled={state.loading} className="btn-submit">
              {state.loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAttendanceModal;
