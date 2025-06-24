import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import rejectionIllustration from '../../images/Reset password-cuate.png'

// Image URL from your provided link
// const REJECTION_IMAGE = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYYc-h4b4k4wRY9u8rHnQGWJHLWnQ6kWxTYQ&s";

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: 'Poppins' , sans-serif;

`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: #f1f3f5;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const AuthImage = styled.img`
  max-width: 80%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
`;

const FormContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const AuthCard = styled.div`
  max-width: 500px;
  width: 100%;
  padding: 2.5rem;
  border-radius: 12px;
  // box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

`;

const Title = styled.h2`
  color: #343a40;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 600;
`;

const LeaveId = styled.p`
  text-align: center;
  color: #495057;
  font-size: 1rem;
  margin-bottom: 2rem;
  
  strong {
    color: #212529;
    font-weight: 600;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #495057;
  font-weight: 500;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s;
  resize: vertical;
  min-height: 120px;

  &:focus {
    outline: none;
    border-color: #6c757d;
    box-shadow: 0 0 0 3px rgba(108, 117, 125, 0.2);
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #6c757d;
    box-shadow: 0 0 0 3px rgba(108, 117, 125, 0.2);
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const Button = styled.button`
  width: 50%;
  background-color:rgb(170, 12, 28);
  color: white;
  margin : 4rem auto;
  padding: 0.875rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: #c82333;
  }

  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

const Message = styled.p`
  margin-top: 1.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  text-align: center;
  color: ${props => props.error ? '#dc3545' : '#28a745'};
  background-color: ${props => props.error ? '#f8d7da' : '#d4edda'};
`;

const LeaveRejection = () => {
  const { id } = useParams();
  const [note, setNote] = useState("");
  const [rejectedBy, setRejectedBy] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!note.trim()) {
      setMessage("Please enter a reason for rejection.");
      return;
    }

    if (!rejectedBy.trim()) {
      setMessage("Please enter your Employee ID (approver).");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5116/leave/reject/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, rejectedBy }),
      });

      const result = await response.text();
      setMessage(result);
    } catch (error) {
      setMessage("❌ Error rejecting leave.");
    }
    setLoading(false);
  };

  return (
    <PageContainer>
      <ImageContainer>
        <AuthImage 
          src={rejectionIllustration} 
          alt="Leave rejection illustration" 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://img.freepik.com/free-vector/cancel-leave-concept-illustration_114360-10122.jpg";
          }}
        />
      </ImageContainer>

      <FormContainer>
        <AuthCard>
          <Title>Reject Leave Request</Title>
          <LeaveId>Leave ID: <strong>{id}</strong></LeaveId>
          
          <FormGroup>
            <Label>Rejection Note</Label>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Please provide a detailed reason for rejecting this leave request..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Your ID</Label>
            <Input
              type="text"
              value={rejectedBy}
              onChange={(e) => setRejectedBy(e.target.value)}
              placeholder="Enter your employee ID"
            />
          </FormGroup>

          <Button onClick={handleReject} disabled={loading}>
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>❌</span>
                <span>Reject Leave</span>
              </>
            )}
          </Button>

          {message && (
            <Message error={message.includes("❌") || message.includes("Error")}>
              {message}
            </Message>
          )}
        </AuthCard>
      </FormContainer>
    </PageContainer>
  );
};

export default LeaveRejection;