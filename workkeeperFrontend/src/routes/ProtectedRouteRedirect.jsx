// ProtectedRouteRedirect.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ProtectedRouteRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        const res = await axios.get("http://localhost:5116/auth/me", {
          withCredentials: true
        });

        const role = res.data.role?.toLowerCase();

        if (role === "admin") {
          navigate("/admin-dashboard");
        } else if (role === "supervisor") {
          navigate("/supervisor-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      } catch (err) {
        navigate("/login");
      }
    };

    fetchAndRedirect();
  }, [navigate]);

  return <div>Redirecting...</div>;
};

export default ProtectedRouteRedirect;
