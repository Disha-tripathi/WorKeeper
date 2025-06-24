import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  IconButton,
  Pagination,
  LinearProgress
} from "@mui/material";
// import { FilterList, NavigateBefore, NavigateNext } from "@mui/icons-material";
import Sidebar from "../components/common/Sidebar";

const AttendanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [date, setDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize
      };
      if (date) params.date = date;
      if (employeeId) params.employeeId = employeeId;

      const res = await axios.get("http://localhost:5116/admin/attendance-logs", {
        params,
        withCredentials: true,
      });

      setLogs(res.data.records);
      setTotalCount(res.data.totalCount);
    } catch (err) {
      console.error("Failed to load logs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5116/names/employees", {
        withCredentials: true,
      });
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, date, employeeId]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const formatTime = (timeString) => {
    if (!timeString) return "--";
    const timePart = timeString.split("T")[1];
    return timePart ? timePart.substring(0, 5) : "--";
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3a 100%)" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="xl">
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: "white", mb: 4 }}>
            📄 Attendance Logs
          </Typography>

          {/* Filters Card */}
          <Card sx={{ mb: 4, background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    style: { color: "white" },
                  }}
                />
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel sx={{ color: "rgba(255, 255, 255, 0.7)" }}>Employee</InputLabel>
                  <Select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    label="Employee"
                    sx={{ color: "white" }}
                  >
                    <MenuItem value="">All Employees</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleFilter}
                //   startIcon={<FilterList />}
                  sx={{
                    background: "linear-gradient(45deg, #4a80f0 0%, #8e54e9 100%)",
                    height: "56px"
                  }}
                >
                  Apply Filters
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card sx={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)" }}>
            <CardContent>
              {loading && <LinearProgress sx={{ mb: 2 }} />}
              <TableContainer component={Paper} sx={{ background: "rgba(255, 255, 255, 0.05)" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Employee</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>In Time</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Out Time</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Total Hours</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Punch Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length > 0 ? (
                      logs.map((log, i) => (
                        <TableRow key={i} hover sx={{ "&:hover": { background: "rgba(255, 255, 255, 0.03)" } }}>
                          <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                            {log.date?.split("T")[0]}
                          </TableCell>
                          <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                            {log.employeeName}
                          </TableCell>
                          <TableCell>
                            <Box
                              component="span"
                              sx={{
                                p: "4px 8px",
                                borderRadius: 1,
                                backgroundColor:
                                  log.status === "Present"
                                    ? "rgba(46, 125, 50, 0.2)"
                                    : log.status === "Absent"
                                    ? "rgba(198, 40, 40, 0.2)"
                                    : "rgba(255, 143, 0, 0.2)",
                                color:
                                  log.status === "Present"
                                    ? "#6fbf73"
                                    : log.status === "Absent"
                                    ? "#f44336"
                                    : "#ffb74d",
                              }}
                            >
                              {log.status}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                            {formatTime(log.inTime)}
                          </TableCell>
                          <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                            {formatTime(log.outTime)}
                          </TableCell>
                          <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                            {log.totalHours ?? "--"}
                          </TableCell>
                          <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                            {log.punchStatus || "--"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: "center", color: "rgba(255, 255, 255, 0.7)", py: 4 }}>
                          {loading ? "Loading..." : "No attendance records found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  shape="rounded"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      color: "white",
                    },
                    "& .MuiPaginationItem-page.Mui-selected": {
                      background: "linear-gradient(45deg, #4a80f0 0%, #8e54e9 100%)",
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
};

export default AttendanceLogs;