import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ManageEmployees.css";
import Sidebar from "../components/common/Sidebar";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Collapse,
  Tooltip
} from "@mui/material";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faSave,
  faTimes,
  faEdit,
  faTrashAlt,
  faUsers,
  faChevronDown,
  faChevronUp,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons';

const initialForm = {
  name: "",
  email: "",
  mobileNumber: "",
  jobTitle: "",
  role: "",
  shiftId: "",
  department: "",
  office: "",
  team: "",
  employeeGroup: "",
  experienceTotalYears: "",
  employmentStatus: "Active",
  educationalDetails: "",
  appraisalDetails: "",
  reportsToUserId: "",
  password: "Default@123"
};

const employmentStatusOptions = [
  { value: "Active", label: "Active" },
  { value: "On Leave", label: "On Leave" },
  { value: "Terminated", label: "Terminated" },
  { value: "Resigned", label: "Resigned" }
];

const ManageEmployees = () => {
  const theme = useTheme();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5116/admin/employees", { withCredentials: true });
      const result = res.data;

      if (Array.isArray(result)) {
        setEmployees(result);
      } else if (Array.isArray(result?.employees)) {
        setEmployees(result.employees);
      } else {
        console.error("Unexpected employee format:", result);
        toast.error("Invalid employee data format");
        setEmployees([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error fetching employees");
      console.error(err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error("Please enter employee name");
      return;
    }
    
    if (!form.email.trim()) {
      toast.error("Please enter email address");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (!editingId && !form.password) {
      toast.error("Please enter a password");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`http://localhost:5116/admin/employees/${editingId}`, form, { 
          withCredentials: true 
        });
        toast.success("Employee updated successfully");
      } else {
        await axios.post("http://localhost:5116/admin/employees", form, { 
          withCredentials: true 
        });
        toast.success("Employee added successfully");
      }
      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);
      await fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving employee");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setForm(employee);
    setEditingId(employee.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5116/admin/employees/${deleteConfirmId}`, { 
        withCredentials: true 
      });
      toast.success("Employee soft-deleted successfully");
      await fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
      console.error(err);
    } finally {
      setLoading(false);
      setOpenDialog(false);
      setDeleteConfirmId(null);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (editingId && !showForm) {
      setEditingId(null);
      setForm(initialForm);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'On Leave': return 'status-on-leave';
      case 'Terminated': return 'status-terminated';
      case 'Resigned': return 'status-resigned';
      default: return '';
    }
  };

  return (
    <Box className="employee-management-container" sx={{ display: "flex" }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="xl">
          {/* Theme Toggle Button */}
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <Button 
              variant="contained" 
              color="primary" 
              className="theme-toggle"
              onClick={toggleTheme}
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
            </Button>
          </Tooltip>

          {/* Header Section */}
          <Card className="management-card" sx={{ mb: 3 }}>
            <Box className="card-header">
              <FontAwesomeIcon 
                icon={faUsers} 
                style={{ marginRight: '12px', color: 'var(--primary-color)' }} 
              />
              <Typography variant="h4" className="card-title">
                Employee Management
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                color="primary"
                onClick={toggleForm}
                startIcon={<FontAwesomeIcon icon={showForm ? faTimes : faUserPlus} />}
                endIcon={<FontAwesomeIcon icon={showForm ? faChevronUp : faChevronDown} />}
                className="action-button"
                disabled={loading}
              >
                {showForm ? 'Close Form' : 'Add Employee'}
              </Button>
            </Box>
          </Card>

          {/* Add/Edit Form */}
          <Collapse in={showForm}>
            <Card className="management-card" sx={{ mb: 4 }}>
              <CardContent className="form-container">
                <Typography variant="h6" className="card-title" gutterBottom>
                  {editingId ? "Edit Employee" : "Add New Employee"}
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    {Object.entries(initialForm).map(([key, _]) => (
                      (key !== "password" || !editingId) && (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                          <TextField
                            fullWidth
                            className="form-input"
                            label={key.split(/(?=[A-Z])/).join(" ")}
                            name={key}
                            value={form[key] || ""}
                            onChange={handleChange}
                            required={key === "name" || key === "email" || (key === "password" && !editingId)}
                            type={
                              key === "experienceTotalYears" ? "number" : 
                              key === "email" ? "email" : 
                              key === "mobileNumber" ? "tel" : "text"
                            }
                            select={key === "employmentStatus"}
                            variant="outlined"
                            size="small"
                            margin="normal"
                          >
                            {key === "employmentStatus" ? (
                              employmentStatusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))
                            ) : null}
                          </TextField>
                        </Grid>
                      )
                    ))}
                  </Grid>
                  <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : 
                                <FontAwesomeIcon icon={editingId ? faSave : faUserPlus} />}
                      className="action-button"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : editingId ? "Update" : "Add"} Employee
                    </Button>
                    {(editingId || showForm) && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleCancel}
                        startIcon={<FontAwesomeIcon icon={faTimes} />}
                        className="action-button"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Collapse>

          {/* Employee List Section */}
          <Card className="management-card">
            <CardContent>
              <Typography variant="h6" className="card-title" gutterBottom>
                Employee List
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <Table className="employee-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Job Title</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Shift</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(employees) && employees.length > 0 ? (
                        employees.map((emp) => (
                          <TableRow key={emp.id} hover>
                            <TableCell>{emp.name}</TableCell>
                            <TableCell>{emp.email}</TableCell>
                            <TableCell>{emp.jobTitle}</TableCell>
                            <TableCell>{emp.mobileNumber}</TableCell>
                            <TableCell>{emp.shiftId}</TableCell>
                            <TableCell>
                              <span className={`status-badge ${getStatusClass(emp.employmentStatus)}`}>
                                {emp.employmentStatus}
                              </span>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                onClick={() => handleEdit(emp)}
                                sx={{ color: 'var(--primary-color)' }}
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDeleteClick(emp.id)}
                                sx={{ color: 'var(--error-color)' }}
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faTrashAlt} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No employees found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Container>

        {/* Delete confirmation dialog */}
        <Dialog
          open={openDialog}
          onClose={() => !loading && setOpenDialog(false)}
          maxWidth="xs"
          fullWidth
          className="confirmation-dialog"
        >
          <DialogTitle className="confirmation-dialog-title">
            Confirm Delete
          </DialogTitle>
          <DialogContent className="confirmation-dialog-content">
            <Typography>
              Are you sure you want to soft-delete this employee? This action
              can be reversed.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDialog(false)}
              className="action-button"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              className="action-button"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FontAwesomeIcon icon={faTrashAlt} />}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ManageEmployees;