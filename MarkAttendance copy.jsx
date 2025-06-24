import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const MarkAttendance = ({ employeeId, token, onAttendanceMarked }) => {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [punchState, setPunchState] = useState("none"); // "none" | "in" | "out"
  const toastId = useRef(null);

  useEffect(() => {
    const fetchShiftAndPunchState = async () => {
      try {
        // Shift info fetch
        const shiftRes = await axios.get(
          `http://localhost:5116/shift/GetCurrentShift/${employeeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("✅ Shift data response:", shiftRes.data);
        setShift(shiftRes.data);

        // Current punch state fetch (assumed API)
        const punchRes = await axios.get(
          `http://localhost:5116/attendance/GetCurrentPunchState/${employeeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Set punch state based on backend data, fallback to 'none'
        setPunchState(punchRes.data.state || "none");
      } catch (err) {
        toast.error("❌ Failed to load shift or punch data");
        console.error(err);
      }
    };

    if (employeeId && token) fetchShiftAndPunchState();
  }, [employeeId, token]);

  const handlePunch = async (punchType) => {
    if (!shift || loading) return;

    try {
      setLoading(true);

      if (!toast.isActive(toastId.current)) {
        toastId.current = toast.info("⏳ Processing...");
      }

      const payload = {
        employeeId,
        shiftId: shift.id,
        source: "web_portal",
        punchType,
      };

      const res = await axios.post(
        "http://localhost:5116/attendance/TakeAttendance",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPunchState(punchType === "In" ? "in" : "out");


      toast.dismiss(toastId.current);
      toast.success(`✅ ${res.data.message}`);

      if (typeof onAttendanceMarked === 'function') {
        onAttendanceMarked();
      }
    } catch (err) {
      toast.dismiss(toastId.current);
      toast.error(err.response?.data?.message || "❌ Error punching");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const formatTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


  return (
    <div className="punch-card">
      <ToastContainer position="top-right" autoClose={3000} />
      <h3>Mark Attendance</h3>

      {shift ? (
        <>
        <div className="shift-info">
          <p><strong>Shift:</strong> {formatTime(shift.startTime)} - {formatTime(shift.endTime)}</p>
          {/* <p><strong>Type:</strong> {shift.isNightShift ? "Night" : "Day"} Shift</p> */}
          <p><strong>Break:</strong> {shift.breakDuration}</p>
          <p><strong>Expected Hours:</strong> {shift.expectedHours} hrs</p>
</div>


          <div className="punch-buttons">
            <button
              onClick={() => handlePunch("In")}
              disabled={loading || punchState !== "none"}
              aria-pressed={punchState === "in"}
            >
              {loading && punchState === "none" ? "Processing..." : "Punch In"}
            </button>

            <button
              onClick={() => handlePunch("Out")}
              disabled={loading || punchState !== "in"}
              className="punch-out"
              aria-pressed={punchState === "out"}
            >
              {loading && punchState === "in" ? "Processing..." : "Punch Out"}
            </button>
          </div>

          {punchState !== "none" && (
            <div className="current-status">
              <p>
                Status:{" "}
                <span className={`status-badge ${punchState}`}>
                  {punchState === "in" ? "Punched In" : "Punched Out"}
                </span>
              </p>
            </div>
          )}
        </>
      ) : 
      (
        <p>Loading shift information...</p>
      )
      }
    </div>
  );
};

export default MarkAttendance;
