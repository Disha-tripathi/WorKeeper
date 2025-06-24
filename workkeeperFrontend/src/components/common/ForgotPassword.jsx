import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled from "styled-components";
import forgotPasswordImage from "../../images/Forgot password-rafiki.png"; 

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;

`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: #4299e1;
  
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
  
  background-color: #fff;
`;

const AuthTitle = styled.h2`
  color: #2d3748;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 600;
`;

const AuthDescription = styled.p`
  text-align: center;
  color: #4a5568;
  margin-bottom: 2rem;
  line-height: 1.5;
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
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
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
  background-color: #4299e1;
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
    background-color: #3182ce;
  }

  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  color: #4299e1;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    text-decoration: underline;
    color: #3182ce;
  }
`;

const ForgotPassword = () => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      const res = await axios.post("http://localhost:5116/auth/forgot-password", { email });
      toast.success(res.data.message || "Password reset link sent to your email!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        "An error occurred while sending the reset link. Please try again."
      );
    }
  };

  return (
    <PageContainer>
      <ImageContainer>
        <AuthImage 
          src={forgotPasswordImage} 
          alt="Forgot password illustration" 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://cdni.iconscout.com/illustration/premium/thumb/forgot-password-5729515-4781246.png";
          }}
        />
      </ImageContainer>

      <FormContainer>
        <AuthCard>
          <AuthTitle>Forgot Password?</AuthTitle>
          <AuthDescription>
            No worries! Enter your email address and we'll send you a link to reset your password.
          </AuthDescription>
          
          <AuthForm onSubmit={handleSubmit(onSubmit)}>
            <InputContainer>
              <InputLabel htmlFor="email">Email Address</InputLabel>
              <InputField
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address"
                  }
                })}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
            </InputContainer>

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </SubmitButton>
          </AuthForm>

          <BackLink href="/login">
            ← Back to Sign In
          </BackLink>
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

export default ForgotPassword;