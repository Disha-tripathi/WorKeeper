import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/pendingLeaves.css";
import Sidebar from "../common/Sidebar";

const PendingLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await axios.get("http://localhost:5116/admin/all-pending", {
          withCredentials: true, 
        });
        setLeaves(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load leave data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  return (
    <div className="pl-container">
      <Sidebar />
        <h1 className="pl-title"> Leave Requests</h1>

      <div className="pl-header">
        <h2 className="pl-title">Pending Leave Requests</h2>
      </div>

      {loading && <p className="pl-message">Loading...</p>}
      {error && <p className="pl-error">{error}</p>}
      {!loading && leaves.length === 0 && (
        <p className="pl-message">No pending leave applications found.</p>
      )}

      {!loading && leaves.length > 0 && (
        <table className="pl-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Start</th>
              <th>End</th>
              <th>Applied On</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave.id}>
                <td>{leave.employeeName}</td>
                <td>{leave.leaveType}</td>
                <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                <td>{new Date(leave.appliedOn).toLocaleDateString()}</td>
                <td>
                  <span className={`pl-status ${leave.status.toLowerCase()}`}>
                    {leave.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
