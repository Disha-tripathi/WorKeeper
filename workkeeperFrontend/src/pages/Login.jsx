import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import "./login.css";

// Configure axios for cookie-based auth
const api = axios.create({
  baseURL: "http://localhost:5116",
  withCredentials: true,
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(
      z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    ),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    console.log("[1] Form submitted with data:", data); // Log input data

    try {
      // Authentication Step
      console.log("[2] Attempting login...");
      const response = await api.post("/auth/login", data);
      console.log("[3] Login response received:", response.data);

      // User Data Verification
      console.log("[4] Verifying user session...");
      const authCheck = await api.get("/auth/me");
      console.log("[5] User session data:", authCheck.data);

      const { id: userId, userName: username, role: rawRole } = authCheck.data;
      const role = rawRole?.toLowerCase();

      if (!userId || !role) {
        throw new Error("Incomplete user data received");
      }

      // Session Storage
      const sessionData = {
        userId,
        username,
        role,
        loggedInAt: new Date().toISOString()
      };
      sessionStorage.setItem("user", JSON.stringify(sessionData));
      console.log("[6] Session data saved:", sessionData);

      // Redirection Logic
      console.log("[7] Preparing redirect...");
      const dashboardRoutes = {
        admin: "/admin-dashboard",
        supervisor: "/supervisor-dashboard",
        employee: "/employee-dashboard",
      };

      console.log("[8] Current user role:", role);
      if (!Object.keys(dashboardRoutes).includes(role)) {
        console.error("[ERROR] Unrecognized role:", role);
        throw new Error("Unauthorized access level");
      }

      console.log("[9] Redirecting to:", dashboardRoutes[role]);
      setTimeout(() => {
        navigate(dashboardRoutes[role]);
        console.log("[10] Redirect completed");
      }, 1500);

      toast.success("Login successful!");

    } catch (error) {
      console.error("[ERROR] Login failed at step:", {
        step: error.config?.step || "unknown",
        error: error.response?.data || error.message,
      });

      toast.error(
        error.response?.data?.message || 
        "Login failed. Check console for details."
      );
    } finally {
      setIsLoading(false);
      console.log("[11] Login process completed");
    }
  };
return (
    <div className="auth-login">
      <div className="auth-login__form-container">
        <div className="auth-login__header">
          <h2 className="auth-login__title">Welcome Back</h2>
          <p className="auth-login__subtitle">Sign in to your account</p>
        </div>

        <form className="auth-login__form" onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-login__input-group">
            <label className="auth-login__label" htmlFor="auth-login-username">Username</label>
            <input
              id="auth-login-username"
              className="auth-login__input"
              type="text"
              autoComplete="username"
              {...register("username")}
              placeholder="Enter your username"
            />
            {errors.username && <p className="auth-login__error">{errors.username.message}</p>}
          </div>

          <div className="auth-login__input-group">
            <label className="auth-login__label" htmlFor="auth-login-password">Password</label>
            <div className="auth-login__password-wrapper">
              <input
                id="auth-login-password"
                className="auth-login__input auth-login__input--password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="auth-login__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon 
                  icon={showPassword ? faEyeSlash : faEye} 
                  className="auth-login__password-icon"
                />
              </button>
            </div>
            {errors.password && <p className="auth-login__error">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            className="auth-login__submit" 
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="auth-login__spinner"></span> Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-login__footer">
            <p className="auth-login__footer-text">
              Forgot your password? <a className="auth-login__footer-link" href="/forgot-password">Reset here</a>
            </p>
          <p className="auth-login__footer-text">
            Don't have an account? <a className="auth-login__footer-link" href="/register">Sign up</a>
          </p>
        </div>
      </div>

      <div className="auth-login__graphic">
        <div className="auth-login__decoration-circles"></div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Login;