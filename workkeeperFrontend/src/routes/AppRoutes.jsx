import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import SupervisorDashboard from "../pages/SupervisorDashboard";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import Attendance from "../pages/Attendance";
import ProtectedRoute from "./ProtectedRoute";
import NotFoundPage from "../components/common/notFound";
import Leave from "../pages/leave";
import LeaveRejection from "../components/leave/LeaveRejection";
import LeaveApproval from "../components/leave/LeaveApproval";
import Alerts from "../components/common/Alert";
import ForgotPassword from "../components/common/ForgotPassword";
import ResetPassword from "../components/common/ResetPassword";
import ProtectedRouteRedirect from "./ProtectedRouteRedirect";
import ManageEmployees from "../Admin/ManageEmployees";
import AttendanceLogs from "../Admin/AttendanceLogs";
import EditAttendance from "../Admin/EditAttendance";
import PendingLeaves from "../components/leave/Pending";


const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Role-Based Auto Redirect (for '/') */}
      <Route path="/" element={<ProtectedRouteRedirect />} />

      {/* ✅ Protected Routes */}

      {/* Admin Only */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/manage-employees" element={<ManageEmployees />} />
        <Route path="/attendance-overview" element={<AttendanceLogs />} />
        <Route path="/edit-attendance" element={<EditAttendance />} />
        <Route path="/pending-leaves" element={<PendingLeaves />} />

      </Route>

      {/* Supervisor Only */}
      {/* <Route element={<ProtectedRoute allowedRoles={["supervisor"]} />}> */}
        <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />

      {/* </Route> */}

      {/* Employee Only */}
      <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      </Route>

      {/* ✅ Shared by All Roles (Admin, Supervisor, Employee) */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "supervisor", "employee"]} />}>
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/leave/approve/:id" element={<LeaveApproval />} />
        <Route path="/leave/reject/:id" element={<LeaveRejection />} />
      </Route>

      {/* Fallbacks */}
      <Route path="/unauthorized" element={<div>You are not authorized to access this page.</div>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
