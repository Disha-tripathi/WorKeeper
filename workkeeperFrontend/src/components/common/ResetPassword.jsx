import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled from "styled-components";

// Image URL from Storyset
const RESET_PASSWORD_IMAGE = "https://storyset.com/illustration/reset-password/cuate#407BFFFF&hide=&hide=complete";

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: #407BFF;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const AuthImage = styled.img`
  max-width: 80%;
  max-height: 80vh;
  object-fit: contain;
`;

const FormContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const AuthCard = styled.div`
  max-width: 400px;
  width: 100%;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background-color: #fff;
`;

const AuthTitle = styled.h2`
  color: #2d3748;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 600;
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
`;

const InputField = styled.input`
  padding: 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #407BFF;
    box-shadow: 0 0 0 3px rgba(64, 123, 255, 0.2);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const ErrorMessage = styled.p`
  color: #e53e3e;
  font-size: 0.75rem;
  margin-top: -0.25rem;
`;

const SubmitButton = styled.button`
  background-color: #407BFF;
  color: white;
  padding: 0.875rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 0.5rem;

  &:hover {
    background-color: #3062CC;
  }

  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const PasswordRequirements = styled.div`
  font-size: 0.75rem;
  color: #4a5568;
  margin-top: -0.5rem;
  padding: 0.5rem;
  background-color: #f8fafc;
  border-radius: 4px;
`;

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const token = query.get("token");
  const email = query.get("email");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !token) {
      console.log("Missing email or token:", { email, token });
      toast.error("Invalid or missing reset token.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill out both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await axios.post("http://localhost:5116/auth/reset-password", {
        email,
        token,
        newPassword,
      });

      toast.success(response.data.message || "Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Reset password error:", err);

      if (err.response) {
        toast.error(err.response.data.message || "Something went wrong.");
      } else if (err.request) {
        toast.error("No response from server. Please try again later.");
      } else {
        toast.error("Unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <ImageContainer>
        <AuthImage 
          src={RESET_PASSWORD_IMAGE} 
          alt="Reset password illustration" 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://cdni.iconscout.com/illustration/premium/thumb/reset-password-5729519-4781250.png";
          }}
        />
      </ImageContainer>

      <FormContainer>
        <AuthCard>
          <AuthTitle>Reset Your Password</AuthTitle>
          
          <AuthForm onSubmit={handleSubmit}>
            <InputContainer>
              <InputLabel htmlFor="newPassword">New Password</InputLabel>
              <InputField
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <PasswordRequirements>
                Must be at least 8 characters
              </PasswordRequirements>
            </InputContainer>

            <InputContainer>
              <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
              <InputField
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </InputContainer>

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </SubmitButton>
          </AuthForm>
        </AuthCard>
      </FormContainer>

      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </PageContainer>
  );
};

export default ResetPassword;