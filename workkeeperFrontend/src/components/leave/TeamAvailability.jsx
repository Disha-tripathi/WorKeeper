import React, { useEffect, useState } from 'react';
import femaleImg from '../../images/femaleteam.png';
import maleImg from '../../images/maleteam.png';
// import './TeamAvailability.css';

// Predefined gender map
const nameGenderMap = {
  "Karishma": "female",
  "Raveena": "female",
  "Disha Tripathi": "female",
  "anjali12": "female",
  "tanu11": "female",
  "Dimple Maurya": "female",
  "Narendra Modi": "male"
};

const getAvatar = (name) => {
  const gender = nameGenderMap[name];
  return gender === "male" ? maleImg : femaleImg;
};

const TeamAvailability = () => {
  const [teamData, setTeamData] = useState([]);
  const employeeId = 3;

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`http://localhost:5116/leave/team-availability/${employeeId}`);
        if (!res.ok) throw new Error("Failed to fetch team data");
        const data = await res.json();
        setTeamData(data);
      } catch (err) {
        console.error("Error fetching team availability:", err);
      }
    };

    fetchTeam();
  }, []);

  return (
    <div className="team-container">
      <h2 className="team-title">Team Availability</h2>
      <div className="team-list">
        {teamData.length === 0 ? (
          <p>Loading team availability...</p>
        ) : (
          teamData.map((member, index) => (
            <div className="team-card" key={index}>
              <img src={getAvatar(member.name)} alt="Avatar" className="avatar" />
              <div className="member-info">
                <p className="member-name">{member.name}</p>
                <span className={`status ${member.status === 'Available' ? 'available' : 'leave'}`}>
                  {member.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamAvailability;
