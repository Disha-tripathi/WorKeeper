import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import Sidebar from "./workkeeperFrontend/src/components/common/Sidebar";
import "../styles/global.css";

function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchAttendance = async () => {
      try {
        const month = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
        const year = selectedDate.getFullYear();
  
        const response = await fetch(`http://localhost:5116/attendance/my-attendance?month=${month}&year=${year}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
  
        setAttendanceData(data);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };
  
    fetchAttendance();
  }, [selectedDate]); // Now it fetches attendance based on selected date
  
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const record = attendanceData.find((r) => r.Date === date.toISOString().split("T")[0]);

      if (record) {
        if (record.Status === "Present") return "present";
        if (record.Status === "Absent") return "absent";
        if (record.Status === "Holiday") return "holiday";
        if (record.Status === "Weekend") return "weekend";
      }
    }
    return null;
  };

  return (
    <div className="attendance-page">
      <Sidebar />
      <div className="calendar-container">
        <h2 className="text-white mb-4">My Attendance</h2>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={tileClassName}
        />
      </div>
    </div>
  );
}

export default Attendance;
