import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import "./register.css";


const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  userName: z.string().min(2, "Username is required"),
  email: z.string().email("Invalid email"),
  mobileNumber: z.string()
    .min(10, "Mobile number must be at least 10 digits")
    .regex(/^[0-9]+$/, "Mobile number must contain only digits"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must have at least one uppercase letter")
    .regex(/[a-z]/, "Password must have at least one lowercase letter")
    .regex(/[^a-zA-Z0-9]/, "Password must have at least one special character (@, #, !, etc.)"),
  role: z.enum(["admin", "supervisor", "employee"], {
    required_error: "Role is required",
  }),
  shiftId: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  jobTitle: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'employee') {
    if (!data.shiftId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Shift ID is required for employees",
        path: ["shiftId"]
      });
    }
    if (!data.jobTitle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Job title is required for employees",
        path: ["jobTitle"]
      });
    }
  }
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [apiResponse, setApiResponse] = useState(null); // Added missing state
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const role = watch("role");

  const onSubmit = async (data) => {
    console.log("Form submission data:", data);
    try {
      const requestData = {
        ...data,
        MobileNumber: data.mobileNumber,
        Experience: data.experience,
        Education: data.education,
      };

      console.log("Request payload:", requestData);

      const response = await axios.post("http://localhost:5116/auth/register", requestData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("API Success Response:", response.data);
      setApiResponse(response.data);
      toast.success("Registration successful! Please check your email for confirmation.");
      
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      
      navigate("/login");
    } catch (error) {
      console.error("API Error Response:", error.response?.data || error.message);
      setApiResponse(error.response?.data || { message: error.message }); // Set error response
      toast.error(error.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="wk-register-container">
      <div className="wk-register-card">
        <div className="wk-register-form-wrapper">
          <h2 className="wk-register-title">Create an Account</h2>

          <form className="wk-register-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="wk-form-group">
              <label className="wk-form-label" htmlFor="wk-fullname">Full Name</label>
              <input 
                type="text" 
                {...register("name")} 
                id="wk-fullname" 
                className="wk-form-input"
                autoComplete="name"
              />
              {errors.name && <p className="wk-form-error">{errors.name.message}</p>}
            </div>

            <div className="wk-form-group">
              <label className="wk-form-label" htmlFor="wk-email">Email</label>
              <input 
                type="email" 
                {...register("email")} 
                id="wk-email" 
                className="wk-form-input"
                autoComplete="email"
              />
              {errors.email && <p className="wk-form-error">{errors.email.message}</p>}
            </div>

            <div className="wk-form-group">
              <label className="wk-form-label" htmlFor="wk-username">Username</label>
              <input 
                type="text" 
                {...register("userName")} 
                id="wk-username" 
                className="wk-form-input"
                autoComplete="username" 
              />
              {errors.userName && <p className="wk-form-error">{errors.userName.message}</p>}
            </div>

            <div className="wk-form-group">
              <label className="wk-form-label" htmlFor="wk-mobile">Mobile Number</label>
              <input 
                type="tel" 
                {...register("mobileNumber")} 
                id="wk-mobile" 
                className="wk-form-input"
                autoComplete="tel"
              />
              {errors.mobileNumber && <p className="wk-form-error">{errors.mobileNumber.message}</p>}
            </div>

            <div className="wk-form-group">
              <label className="wk-form-label" htmlFor="wk-password">Password</label>
              <div className="wk-password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  {...register("password")} 
                  id="wk-password" 
                  className="wk-form-input"
                  autoComplete="new-password" 
                />
                <button 
                  type="button" 
                  className="wk-password-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="wk-form-error">{errors.password.message}</p>}
            </div>

            <div className="wk-form-group">
              <label className="wk-form-label" htmlFor="wk-role">Role</label>
              <select 
                {...register("role")} 
                id="wk-role"
                className="wk-form-select"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
                <option value="employee">Employee</option>
              </select>
              {errors.role && <p className="wk-form-error">{errors.role.message}</p>}
            </div>

            {(selectedRole === "employee" || selectedRole === "admin" || selectedRole === "supervisor") && (
              <div className="wk-employee-fields">
                <div className="wk-form-group">
                  <label className="wk-form-label" htmlFor="wk-shift-id">Shift ID</label>
                  <input 
                    type="text" 
                    {...register("shiftId")} 
                    id="wk-shift-id" 
                    className="wk-form-input"
                  />
                  {errors.shiftId && <p className="wk-form-error">{errors.shiftId.message}</p>}
                </div>

                <div className="wk-form-group">
                  <label className="wk-form-label" htmlFor="wk-job-title">Job Title</label>
                  <input 
                    type="text" 
                    {...register("jobTitle")} 
                    id="wk-job-title" 
                    className="wk-form-input"
                  />
                  {errors.jobTitle && <p className="wk-form-error">{errors.jobTitle.message}</p>}
                </div>

                <div className="wk-form-group">
                  <label className="wk-form-label" htmlFor="wk-experience">Experience (Years)</label>
                  <input 
                    type="number" 
                    {...register("experience")} 
                    id="wk-experience" 
                    className="wk-form-input"
                  />
                </div>

                <div className="wk-form-group">
                  <label className="wk-form-label" htmlFor="wk-education">Education</label>
                  <textarea 
                    {...register("education")} 
                    id="wk-education" 
                    className="wk-form-textarea"
                    rows="3"
                  />
                </div>

                {/* <div className="wk-form-group">
                  <label className="wk-form-label" htmlFor="wk-reports-to">Reports To User ID</label>
                  <input 
                    type="text" 
                    {...register("reportsToUserId")} 
                    id="wk-reports-to" 
                    className="wk-form-input"
                  />
                </div> */}
              </div>
            )}

            <button 
              type="submit" 
              className="wk-register-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Sign Up"}
            </button>
          </form>
          {apiResponse && (
            <div className="wk-api-response">
              <h3 className="wk-api-response-title">API Response:</h3>
              <pre className="wk-api-response-json">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
          <p className="wk-login-link">
            Already have an account? <Link to="/login" className="wk-login-link-text">Sign in</Link>
          </p>
        </div>

        <div className="wk-register-graphic">
          <div className="wk-graphic-circle"></div>
        </div>
      </div>
    </div>
  );
};

export default Register;
