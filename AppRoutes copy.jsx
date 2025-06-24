// import { Routes, Route } from "react-router-dom";
// import Login from "../pages/Login";
// import Register from "../pages/Register";
// import AdminDashboard from "../pages/AdminDashboard";
// import SupervisorDashboard from "../pages/SupervisorDashboard";
// import EmployeeDashboard from "../pages/EmployeeDashboard";
// import ProtectedRoute from "./ProtectedRoute";

// const AppRoutes = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<Register />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />

//       <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
//         <Route path="/admin-dashboard" element={<AdminDashboard />} />
//       </Route>

//       <Route element={<ProtectedRoute allowedRoles={["supervisor"]} />}>
//         <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
//       </Route>

//       <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
//         <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
//       </Route>
//     </Routes>
//   );
// };

// export default AppRoutes;
