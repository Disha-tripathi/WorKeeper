import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PunchHistory from './PunchHistory'; // Uncomment if needed
import '../../styles/attendance.css';

const MarkAttendance = () => {
  // ✅ States
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [punchState, setPunchState] = useState("none");
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [employeeId, setEmployeeId] = useState(null);

  // ✅ Refs
  const isMounted = useRef(true);
  const toastId = useRef(null);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ Toast functions
  const showToast = {
    loading: () => {
      toastId.current = toast.info("⏳ Processing...", { autoClose: false });
    },
    dismiss: () => toast.dismiss(toastId.current),
    error: (msg) => toast.error(msg || "❌ Something went wrong"),
    success: (msg) => toast.success(`✅ ${msg}`)
  };

  // ✅ Format time from "HH:mm:ss" to "h:mm AM/PM"
  const formatTime = useCallback((timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  }, []);

  // ✅ Detect night shift (starts late or ends early)
  const isNightShift = useCallback((shift) => {
    if (!shift) return false;
    const { startTime, endTime } = shift;
    return startTime >= "22:00:00" || endTime <= "06:00:00" || startTime > endTime;
  }, []);

  // ✅ Fetch punch state (last punch)
  const fetchPunchState = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5116/attendance/lastpunch", {
        withCredentials: true
      });
      const punchType = res.data?.punchType?.toLowerCase() || "none";
      if (isMounted.current) setPunchState(punchType);
    } catch (err) {
      if (!isMounted.current) return;
      if (err.response?.status === 404) {
        setPunchState("none");
      } else {
        console.error("❌ Fetch punch state error:", err);
        showToast.error(err.response?.data?.message || "Failed to load punch data");
      }
    }
  }, []);

  // ✅ Fetch user info, shift and punch data (single call on mount)
  const fetchCurrentUserAndData = useCallback(async () => {
    try {
      const userRes = await axios.get("http://localhost:5116/auth/me", {
        withCredentials: true
      });

      const { role, employeeId: empId } = userRes.data;
      console.log("Role from server:", role);

      const normalizedRole = role?.toLowerCase();
      console.log("Normalized role:", normalizedRole);

      if (!["employee", "supervisor", "admin"].includes(normalizedRole) || !empId) {
        console.error("You are not eligible to mark attendance");
        showToast.error("You are not eligible to mark attendance.");
        return;
      }

      setEmployeeId(empId);
      console.log("👤 Logged-in Employee ID:", empId);
  

      const shiftRes = await axios.get("http://localhost:5116/shift/GetCurrentShift", {
        withCredentials: true
      });

      const shiftData = shiftRes.data;
      shiftData.isNightShift = isNightShift(shiftData);
      console.log("🕘 Shift Info:", shiftData);
      setShift(shiftData);

      const punchRes = await axios.get("http://localhost:5116/attendance/lastpunch", {
        withCredentials: true
      });

      console.log("📌 Last Punch:", punchRes.data);
      setPunchState(punchRes.data.punchType?.toLowerCase() || "none");

    } catch (err) {
      console.error("❌ Error fetching user or data:", err);
      showToast.error(err.response?.data?.message || "Failed to load user/shift/punch data");
    } finally {
      setInitialLoading(false);
    }
  }, [isNightShift]);

  // ✅ useEffect on mount
  useEffect(() => {
    fetchCurrentUserAndData();
  }, [fetchCurrentUserAndData]);

  // ✅ Re-fetch shift and punchState if employeeId changes
  const fetchShiftAndPunchState = useCallback(async () => {
    if (!employeeId) return;
    setInitialLoading(true);

    try {
      const res = await axios.get("http://localhost:5116/shift/GetCurrentShift", {
        withCredentials: true
      });

      const shiftData = res.data;
      shiftData.isNightShift = isNightShift(shiftData);
      if (isMounted.current) {
        setShift(shiftData);
        await fetchPunchState();
      }
    } catch (err) {
      if (!isMounted.current) return;
      console.error("❌ Shift fetch error:", err);
      showToast.error(err.response?.data?.message || "Failed to load shift data");
    } finally {
      if (isMounted.current) setInitialLoading(false);
    }
  }, [employeeId, fetchPunchState, isNightShift]);

  useEffect(() => {
    if (employeeId) {
      fetchShiftAndPunchState();
    }
  }, [employeeId, fetchShiftAndPunchState]);

  // ✅ Handle punch
  const handlePunch = async () => {
    if (!shift || loading || !employeeId) return;

    console.log("🔍 Punching attendance for employee:", employeeId);
    console.log("Shift ID:", shift.id);

    try {
      setLoading(true);
      showToast.loading();

      const payload = {
        employeeId,
        shiftId: shift.id,
        source: 2
      };

      const res = await axios.post("http://localhost:5116/attendance/TakeAttendance", payload, {
        withCredentials: true
      });

      if (isMounted.current) {
        await fetchPunchState();
        showToast.dismiss();
        showToast.success(res.data.message);
        setRefreshHistory((prev) => prev + 1);
      }
    } catch (err) {
      if (!isMounted.current) return;
      showToast.dismiss();
      console.error("❌ Punch error:", err);
      showToast.error(err.response?.data?.message || "Error punching attendance");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };
  
  return (
    <div className="punch-card">
      <ToastContainer position="top-right" autoClose={3000} />
      <h3>Shift Details</h3>

      {initialLoading ? (
        <p>Loading shift information...</p>
      ) : shift ? (
        <>
          <div className="shift-info">
            <p>
              <strong>Shift:</strong>{" "}
              <span className="shift-time">
                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
              </span>
            </p>
            <p>
              <strong>Type:</strong>{" "}
              <span className={`shift-type ${shift.isNightShift ? "night" : "day"}`}>
                {shift.isNightShift ? "Night Shift" : "Day Shift"}
              </span>
            </p>
            <p>
              <strong>Break:</strong>{" "}
              <span className="shift-duration">{shift.breakDuration}</span>
            </p>
            <p>
              <strong>Expected Hours:</strong>{" "}
              <span className="shift-hours">{shift.expectedHours} hrs</span>
            </p>
          </div>

          <div className="punch-buttons">
            <h3>Mark Attendance</h3>
            <button
              onClick={handlePunch}
              disabled={loading}
              className={loading ? "loading" : ""}
            >
              {loading ? "Processing..." : punchState === "in" ? "Punch Out" : "Punch In"}
            </button>
          </div>

          <div className={`current-status status-${punchState}`}>
            {punchState === "none" && <p>Please Punch In to start your shift.</p>}
            {punchState === "in" && <p>You are punched in. Please Punch Out when you finish.</p>}
            {punchState === "out" && <p>You have punched out.</p>}
          </div>

          {/* <PunchHistory refreshTrigger={refreshHistory} /> */}
        </>
      ) : (
        <p>No shift information available</p>
      )}
    </div>
  );
};

export default MarkAttendance;
