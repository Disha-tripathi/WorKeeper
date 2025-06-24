import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const ProtectedRoute = ({ allowedRoles }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('access_token='))
          ?.split('=')[1];

        console.log("🔑 Token from cookie:", token || 'None found');

        const res = await axios.get("http://localhost:5116/auth/me", {
          withCredentials: true
        });

        const userRole = res.data.role?.toLowerCase();
        const allowed = allowedRoles.map(r => r.toLowerCase());

        console.log("👤 User Role from /auth/me:", userRole);
        console.log("✅ Allowed Roles:", allowed);

        if (userRole && allowed.includes(userRole)) {
          setIsAuthorized(true);
        } else {
          console.warn("🚫 Role not allowed");
        }
      } catch (err) {
        console.error("❌ Auth check failed:", err.response?.data || err.message);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [allowedRoles]);

  if (!authChecked) return <div>Loading...</div>;

  return isAuthorized ? <Outlet /> : (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🚫 You are not authorized to access this page.</h2>
    </div>
  );
};

export default ProtectedRoute;
