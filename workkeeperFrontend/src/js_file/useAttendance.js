import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const useAttendance = (selectedDate) => {
  const [state, setState] = useState({
    attendanceData: [],
    error: null,
    loading: true,
    selectedRecord: null,
    showDetails: false,
    stats: null
  });

  // Format Date as YYYY-MM-DD (e.g. 2025-05-18)
  const formatDate = useCallback((date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch attendance data for the given selected month/year
  const fetchAttendance = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();

      const response = await axiosInstance.get(`/attendance/myattendance?month=${month}&year=${year}`);

      const calendar = response.data?.attendanceCalendar?.map(day => ({
        ...day,
        date: day.date,
        status: day.status,
        punchIn: day.punchIn,
        punchOut: day.punchOut,
        isHoliday: day.isHoliday,
        isWeekend: day.isWeekend,
        isFuture: day.isFuture,
        editedBy: day.editedBy,
        deletedAt: day.deletedAt
      })) || [];

      setState(prev => ({
        ...prev,
        attendanceData: calendar,
        loading: false,
        error: calendar.length === 0 ? "No records found" : null
      }));

    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.status === 401 ? "Please login again" : `Failed to load data: ${err.message}`,
        loading: false
      }));
    }
  }, [selectedDate]);

  const refreshAttendanceData = async () => {
    await fetchAttendance();
  };

  // Class names for calendar tiles based on attendance status and date properties
  const tileClassName = useCallback(({ date, view }) => {
    if (view !== "month") return null;

    const record = state.attendanceData.find(r => r.date === formatDate(date));
    if (!record) return null;

    if (record.deletedAt) return "deleted";
    if (record.isHoliday) return "holiday";
    if (record.isWeekend) return "weekend";
    if (record.isFuture) return "upcoming";

    return record.status?.toLowerCase() || null;
  }, [state.attendanceData, formatDate]);

  // Handle clicking a date on the calendar
const handleDateClick = useCallback((date) => {
  const formattedDate = formatDate(date);
  const matchedRecords = state.attendanceData.filter(r => r.date === formattedDate);

if (!matchedRecords || matchedRecords.length === 0) {
  setState(prev => ({ ...prev, showDetails: false }));
  return;
}

// Option 1: Automatically pick first (optional)
const record = matchedRecords[0]; // or show a list for user to choose

  if (!record) {
    setState(prev => ({ ...prev, showDetails: false }));
    return;
  }
  console.log("Clicked Date:", formattedDate);
console.log("Matching Records:", matchedRecords.map(r => ({ id: r.id, date: r.date })));

  setState(prev => ({
    ...prev,
    selectedRecord: record,
    showDetails: true
  }));
}, [state.attendanceData, formatDate]);

// Edit attendance record
  const editAttendanceRecord = async (recordId, updates) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const editedBy = `${user.role} (${user.name})`;
      
      const response = await axiosInstance.patch(`/attendance/${recordId}`, {
        ...updates,
        editedBy,
        editTimestamp: new Date().toISOString()
      });

      await refreshAttendanceData();
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Soft delete attendance record
  const deleteRecord = async (id) => {
    console.log("Deleting record with id:", id);
    try {
      await axiosInstance.delete(`/attendance/delete-attendance/${id}`);
      toast.success("Attendance deleted successfully");
      // Optional: refresh UI
    } catch (err) {
      console.error(err);
      alert("Failed to delete attendance");
    }
  };
  
  

  // Export attendance data
const exportPunchData = async () => {
  try {
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    const response = await axiosInstance.get(`/attendance/export?month=${month}&year=${year}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AttendanceExport_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Download failed:", error);
  }
};

  // Get day summary
const getSummary = async (type, date) => {
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    let url = '';

    switch (type) {
      case 'day':
        url = `/attendance/summary?date=${formattedDate}`;
        break;
      case 'month':
        url = `/attendance/summary?month=${month}&year=${year}`;
        break;
      case 'year':
        url = `/attendance/summary?year=${year}`;
        break;
      default:
        throw new Error('Invalid summary type');
    }

    const response = await axiosInstance.get(url);
    return response.data;
  } catch (err) {
    toast.error(`Failed to load ${type} summary`);
    console.error(err);
    throw err;
  }
};

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    ...state,
    tileClassName,
    formatDate,
    handleDateClick,
    fetchAttendance,
    refreshAttendanceData,
    editAttendanceRecord,
    deleteRecord,
    exportPunchData,
    getSummary,
    retry: fetchAttendance,
    setShowDetails: (show) => setState(prev => ({ ...prev, showDetails: show }))
  };
};

export default useAttendance;