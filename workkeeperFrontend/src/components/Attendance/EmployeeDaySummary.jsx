import React, { useState, useEffect, useRef } from 'react';
import { format, getMonth, getYear, isValid } from 'date-fns';
import axiosInstance from '../../api/axiosInstance';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ResponsiveContainer
} from 'recharts';
import { FiX, FiDownload, FiCalendar, FiClock, FiHome, FiSun, FiAlertCircle } from 'react-icons/fi';

// CSS Styles
const styles = `
  .eds-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .eds-container {
    background: linear-gradient(135deg, #0f0c29 0%, #1a1a3a 100%);
    border-radius: 12px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .eds-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(15, 12, 41, 0.7);
  }

  .eds-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
  }

  .eds-header p {
    margin: 4px 0 0;
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .eds-close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #94a3b8;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .eds-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .eds-tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(15, 12, 41, 0.5);
  }

  .eds-tab {
    flex: 1;
    padding: 12px;
    border: none;
    background: none;
    font-weight: 500;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .eds-tab:hover {
    color: #60a5fa;
    background-color: rgba(96, 165, 250, 0.1);
  }

  .eds-tab-active {
    color: #60a5fa;
    border-bottom: 2px solid #60a5fa;
    background-color: rgba(96, 165, 250, 0.05);
  }

  .eds-content {
    padding: 20px;
    overflow-y: auto;
    flex-grow: 1;
  }

  .eds-card {
    background: rgba(15, 12, 41, 0.5);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .eds-stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .eds-stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background: rgba(26, 26, 58, 0.7);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: transform 0.2s;
  }

  .eds-stat-card:hover {
    transform: translateY(-2px);
  }

  .eds-stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.1);
  }

  .eds-stat-label {
    font-size: 0.875rem;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .eds-stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #ffffff;
  }

  .eds-month-summary {
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
  }

  .eds-month-summary:last-child {
    border-bottom: none;
  }

  .eds-export-btn {
    background-color: #60a5fa;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    transition: all 0.2s;
  }

  .eds-export-btn:hover {
    background-color: #3b82f6;
    transform: translateY(-1px);
  }

  .eds-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #94a3b8;
  }

  .eds-chart-container {
    margin: 20px 0;
    background: rgba(15, 12, 41, 0.5);
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* Chart styling for dark theme */
  .recharts-default-tooltip {
    background: #1a1a3a !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #e2e8f0 !important;
  }

  .recharts-legend-item-text {
    color: #e2e8f0 !important;
  }

  .recharts-cartesian-axis-tick-value {
    fill: #94a3b8 !important;
  }

  .recharts-cartesian-grid line {
    stroke: rgba(255, 255, 255, 0.1) !important;
  }
`;

const COLORS = ['#4ADE80', '#F87171', '#FBBF24', '#60A5FA', '#A78BFA'];
const STATUS_COLORS = {
  present: '#4ADE80',
  absent: '#F87171',
  partial: '#FBBF24',
  wfh: '#60A5FA',
  holiday: '#A78BFA'
};

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
};

const EdsStatCard = ({ icon, label, value, color }) => (
  <div className="eds-stat-card">
    <div className="eds-stat-icon" style={{ color: color }}>
      {icon}
    </div>
    <span className="eds-stat-label">{label}</span>
    <span className="eds-stat-value">{value}</span>
  </div>
);

const EmployeeDashboardSummary = ({ selectedDate, onClose }) => {
  const [activeTab, setActiveTab] = useState('day');
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [yearly, setYearly] = useState(null);
  const [monthDays, setMonthDays] = useState([]);
  const pdfRef = useRef(null);

  const isValidDate = selectedDate instanceof Date && isValid(selectedDate);
  const month = isValidDate ? getMonth(selectedDate) + 1 : 1;
  const year = isValidDate ? getYear(selectedDate) : new Date().getFullYear();
  const formattedDate = isValidDate ? format(selectedDate, 'MMM dd, yyyy') : '';

  useEffect(() => {
    if (!isValidDate) return;

    const loadAll = async () => {
      setLoading(true);
      try {
        const [dayRes, monthRes, yearRes] = await Promise.all([
          axiosInstance.get(`/attendance/summary?date=${format(selectedDate, 'yyyy-MM-dd')}`),
          axiosInstance.get(`/attendance/summary?month=${month}&year=${year}`),
          axiosInstance.get(`/attendance/summary?year=${year}`)
        ]);
        setDaily(dayRes.data);
        setMonthly(monthRes.data);
        setYearly(yearRes.data);

        const days = Array.from({ length: 31 }, (_, i) => ({ 
          day: i + 1, 
          netWorkingMinutes: Math.floor(Math.random() * 480) 
        }));
        setMonthDays(days);
      } catch (err) {
        console.error('Error loading summary:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [selectedDate]);

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().from(pdfRef.current).set({
      margin: 0.5,
      filename: `Attendance_Summary_${year}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).save();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="eds-overlay">
        <div className="eds-container">
          <div className="eds-header">
            <div>
              <h3>Attendance Summary</h3>
              <p>
                {activeTab === 'day' && formattedDate}
                {activeTab === 'month' && format(selectedDate, 'MMMM yyyy')}
                {activeTab === 'year' && year}
              </p>
            </div>
            <button onClick={onClose} className="eds-close-btn">
              <FiX size={20} />
            </button>
          </div>

          <div className="eds-tabs">
            <button 
              className={`eds-tab ${activeTab === 'day' ? 'eds-tab-active' : ''}`}
              onClick={() => setActiveTab('day')}
            >
              <FiCalendar /> Daily
            </button>
            <button 
              className={`eds-tab ${activeTab === 'month' ? 'eds-tab-active' : ''}`}
              onClick={() => setActiveTab('month')}
            >
              <FiCalendar /> Monthly
            </button>
            <button 
              className={`eds-tab ${activeTab === 'year' ? 'eds-tab-active' : ''}`}
              onClick={() => setActiveTab('year')}
            >
              <FiCalendar /> Yearly
            </button>
          </div>

          <div className="eds-content" ref={pdfRef}>
            {loading ? (
              <div className="eds-loading">Loading data...</div>
            ) : (
              <>
                {activeTab === 'day' && daily && (
                  <div className="eds-card">
                    <div className="eds-stat-grid">
                      <EdsStatCard 
                        icon={<FiClock color={STATUS_COLORS.present} />}
                        label="Status"
                        value={daily.status}
                        color={STATUS_COLORS.present}
                      />
                      <EdsStatCard 
                        icon={<FiClock color="#60A5FA" />}
                        label="In Time"
                        value={daily.inTime || 'N/A'}
                        color="#60A5FA"
                      />
                      <EdsStatCard 
                        icon={<FiClock color="#F87171" />}
                        label="Out Time"
                        value={daily.outTime || 'N/A'}
                        color="#F87171"
                      />
                      <EdsStatCard 
                        icon={<FiClock color="#4ADE80" />}
                        label="Total"
                        value={formatDuration(daily.totalWorkingMinutes)}
                        color="#4ADE80"
                      />
                      <EdsStatCard 
                        icon={<FiAlertCircle color="#FBBF24" />}
                        label="Break"
                        value={formatDuration(daily.breakMinutes)}
                        color="#FBBF24"
                      />
                      <EdsStatCard 
                        icon={<FiClock color="#A78BFA" />}
                        label="Net"
                        value={formatDuration(daily.netWorkingMinutes)}
                        color="#A78BFA"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'month' && monthly && (
                  <>
                    <div className="eds-card">
                      <div className="eds-stat-grid">
                        <EdsStatCard 
                          icon={<FiCalendar color={STATUS_COLORS.present} />}
                          label="Present"
                          value={monthly.presentDays}
                          color={STATUS_COLORS.present}
                        />
                        <EdsStatCard 
                          icon={<FiCalendar color={STATUS_COLORS.absent} />}
                          label="Absent"
                          value={monthly.absentDays}
                          color={STATUS_COLORS.absent}
                        />
                        <EdsStatCard 
                          icon={<FiCalendar color={STATUS_COLORS.partial} />}
                          label="Partial"
                          value={monthly.partialDays}
                          color={STATUS_COLORS.partial}
                        />
                        <EdsStatCard 
                          icon={<FiHome color={STATUS_COLORS.wfh} />}
                          label="WFH"
                          value={monthly.workFromHomeDays}
                          color={STATUS_COLORS.wfh}
                        />
                        <EdsStatCard 
                          icon={<FiSun color={STATUS_COLORS.holiday} />}
                          label="Holidays"
                          value={monthly.holidays}
                          color={STATUS_COLORS.holiday}
                        />
                        <EdsStatCard 
                          icon={<FiCalendar color="#94a3b8" />}
                          label="Working Days"
                          value={monthly.totalWorkingDays}
                          color="#94a3b8"
                        />
                      </div>
                    </div>

                    <div className="eds-chart-container">
                      <PieChart width={350} height={250}>
                        <Pie
                          data={[
                            { name: 'Present', value: monthly.presentDays },
                            { name: 'Absent', value: monthly.absentDays },
                            { name: 'Partial', value: monthly.partialDays },
                            { name: 'WFH', value: monthly.workFromHomeDays },
                            { name: 'Holidays', value: monthly.holidays },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                          dataKey="value"
                        >
                          {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </div>

                    {/* <div className="eds-chart-container">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthDays}>
                          <XAxis dataKey="day" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip />
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                          <Line type="monotone" dataKey="netWorkingMinutes" stroke="#4ADE80" name="Net Minutes" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div> */}
                  </>
                )}

                {activeTab === 'year' && yearly && (
                  <>
                    <div className="eds-card">
                      {yearly.months.map((m) => (
                        <div key={m.month} className="eds-month-summary">
                          <strong>Month {m.month}:</strong> ✅ {m.presentDays}, ❌ {m.absentDays}, 🟠 {m.partialDays}, 🏠 {m.workFromHomeDays}, ⏱ {m.totalHoursWorked} hrs
                        </div>
                      ))}
                    </div>

                    <div className="eds-chart-container">
                      <BarChart width={500} height={300} data={yearly.months}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="presentDays" stackId="a" fill="#4ADE80" name="Present" />
                        <Bar dataKey="absentDays" stackId="a" fill="#F87171" name="Absent" />
                        <Bar dataKey="partialDays" stackId="a" fill="#FBBF24" name="Partial" />
                      </BarChart>
                    </div>

                    <button onClick={handleExportPDF} className="eds-export-btn">
                      <FiDownload /> Export as PDF
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeDashboardSummary;