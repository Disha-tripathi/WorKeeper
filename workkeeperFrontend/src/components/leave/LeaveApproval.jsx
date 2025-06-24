import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Confetti from 'react-confetti';

// Animation keyframes
const popIn = keyframes`
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  70% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Styled components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  animation: ${fadeIn} 0.5s ease-out;
`;

const CelebrationCard = styled.div`
  position: relative;
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 90%;
  animation: ${popIn} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 10;
`;

const CelebrationIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #4CAF50;
`;

const CelebrationTitle = styled.h2`
  color: #2e7d32;
  margin-bottom: 1rem;
`;

const CelebrationMessage = styled.p`
  color: #555;
  margin-bottom: 2rem;
  font-size: 1.1rem;
`;

const RedirectMessage = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-top: 1.5rem;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4CAF50;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LeaveApproval = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const approverId = searchParams.get("approverId");
  const [message, setMessage] = useState("Processing your approval...");
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const approveLeave = async () => {
      try {
        // First approve the leave
        const response = await fetch(`http://localhost:5116/leave/approve/${id}?approverId=${approverId}`, {
          method: 'PUT',
        });

        const result = await response.json();
        setMessage(result.message || "Leave approved successfully!");
        setSuccess(true);

        // Then get user role (you'll need to implement this endpoint)
        const userResponse = await fetch(`http://localhost:5116/users/${approverId}/role`);
        const userData = await userResponse.json();
        setUserRole(userData.role);

        // Redirect after 3 seconds
        setTimeout(() => {
          switch(userData.role) {
            case 'admin':
              navigate('/admin/dashboard');
              break;
            case 'supervisor':
              navigate('/supervisor/dashboard');
              break;
            default:
              navigate('/employee/dashboard');
          }
        }, 3000);

      } catch (error) {
        setMessage("Error processing approval. Please try again.");
        setSuccess(false);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    approveLeave();
  }, [id, approverId, navigate]);

  return (
    <Container>
      {success && (
        <>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        </>
      )}

      <CelebrationCard>
        <CelebrationIcon>
          {success ? '🎉' : <LoadingSpinner />}
        </CelebrationIcon>
        
        <CelebrationTitle>
          {success ? 'Approved Successfully!' : 'Processing Approval'}
        </CelebrationTitle>
        
        <CelebrationMessage>
          {message}
        </CelebrationMessage>
        
        {success && (
          <>
            <div style={{ fontSize: '3rem', margin: '1rem 0' }}>✅</div>
            <RedirectMessage>
              Redirecting to your {userRole ? `${userRole} ` : ''}dashboard...
            </RedirectMessage>
          </>
        )}
      </CelebrationCard>
    </Container>
  );
};

export default LeaveApproval;