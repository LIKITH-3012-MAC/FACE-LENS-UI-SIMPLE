import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Users,
  TrendingUp,
  Filter,
  RefreshCw,
  Printer
} from 'lucide-react';
import {
  getDailyReport,
  getMonthlyReport,
  getStudentWiseReport,
  getExportCsvUrl
} from '../services/api';
import { formatDate, formatTime, formatPercentage, getStatusBadge } from '../utils/formatters';
import Toast from '../components/Toast';

export default function Reports() {
  const [reportType, setReportType] = useState('daily'); // 'daily', 'monthly', 'student-wise'

  // Daily report params
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState(null);

  // Monthly report params
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState(null);

  // Student-wise report params
  const [studentWiseData, setStudentWiseData] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'daily') {
        const res = await getDailyReport(dailyDate);
        setDailyData(res.data);
      } else if (reportType === 'monthly') {
        const res = await getMonthlyReport(monthlyYear, monthlyMonth, departmentFilter);
        setMonthlyData(res.data);
      } else if (reportType === 'student-wise') {
        const res = await getStudentWiseReport({ department: departmentFilter });
        setStudentWiseData(res.data || []);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, dailyDate, monthlyYear, monthlyMonth, departmentFilter]);

  const handleExportCsv = () => {
    let url = '';
    if (reportType === 'student-wise') {
      url = getExportCsvUrl('student-wise', { department: departmentFilter });
    } else {
      url = getExportCsvUrl('attendance', { report_date: dailyDate, department: departmentFilter });
    }
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Analytics & Reports</h1>
          <p className="page-subtitle">
            Generate college viva reports, daily summaries, monthly trends, and CSV exports
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} /> Print Report
          </button>
          <button onClick={handleExportCsv} className="btn btn-primary">
            <Download size={16} /> Export to CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <button
          onClick={() => setReportType('daily')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            color: reportType === 'daily' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: reportType === 'daily' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Daily Report
        </button>

        <button
          onClick={() => setReportType('student-wise')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            color: reportType === 'student-wise' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: reportType === 'student-wise' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Student-Wise Percentage Report
        </button>

        <button
          onClick={() => setReportType('monthly')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            color: reportType === 'monthly' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: reportType === 'monthly' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Monthly Aggregate
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        {reportType === 'daily' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Select Date:</span>
            <input
              type="date"
              className="form-control"
              style={{ width: '180px' }}
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
            />
          </div>
        )}

        {reportType === 'monthly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Month & Year:</span>
            <select
              className="form-select"
              style={{ width: '140px' }}
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="form-control"
              style={{ width: '100px' }}
              value={monthlyYear}
              onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
            />
          </div>
        )}

        {(reportType === 'student-wise' || reportType === 'monthly') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Department:</span>
            <select
              className="form-select"
              style={{ width: '200px' }}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication">Electronics & Comm.</option>
              <option value="Mechanical Engineering">Mechanical</option>
            </select>
          </div>
        )}

        <button onClick={loadReport} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* DAILY REPORT CONTENT */}
      {reportType === 'daily' && (
        <div>
          {/* Summary Pills */}
          {dailyData?.summary && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Enrolled</span>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{dailyData.summary.total_students}</p>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Present</span>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                  {dailyData.summary.present}
                </p>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Late Arrivals</span>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>
                  {dailyData.summary.late}
                </p>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Absent</span>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
                  {dailyData.summary.absent}
                </p>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Daily Percentage</span>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {dailyData.summary.attendance_percentage}%
                </p>
              </div>
            </div>
          )}

          {/* Daily Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Section</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData?.records?.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                        No attendance logs recorded for {dailyDate}
                      </td>
                    </tr>
                  ) : (
                    dailyData?.records?.map((r) => {
                      const badge = getStatusBadge(r.status);
                      return (
                        <tr key={r.id}>
                          <td className="code-font">{r.student_id}</td>
                          <td style={{ fontWeight: 600 }}>{r.name}</td>
                          <td>{r.roll_number}</td>
                          <td>{r.department}</td>
                          <td>{r.section}</td>
                          <td>{formatTime(r.attendance_time)}</td>
                          <td><span className={badge.className}>{badge.label}</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT-WISE PERCENTAGE REPORT CONTENT */}
      {reportType === 'student-wise' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Year / Sec</th>
                  <th>Total Classes</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {studentWiseData.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      No student records found
                    </td>
                  </tr>
                ) : (
                  studentWiseData.map((s) => {
                    const isDefaulter = s.percentage < 75;
                    return (
                      <tr key={s.student_id}>
                        <td style={{ fontWeight: 600 }}>{s.roll_number}</td>
                        <td className="code-font">{s.student_id}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.department}</td>
                        <td>{s.year} - {s.section}</td>
                        <td>{s.total_classes}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{s.present}</td>
                        <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{s.late}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{s.absent}</td>
                        <td>
                          <span className="badge" style={{
                            backgroundColor: isDefaulter ? '#fef2f2' : '#ecfdf5',
                            color: isDefaulter ? '#991b1b' : '#065f46',
                            border: `1px solid ${isDefaulter ? '#fecaca' : '#a7f3d0'}`
                          }}>
                            {formatPercentage(s.percentage)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY AGGREGATE CONTENT */}
      {reportType === 'monthly' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Class Date</th>
                  <th>Attended Students</th>
                  <th>Present Count</th>
                  <th>Late Count</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData?.daily_aggregates?.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      No attendance aggregated for this month
                    </td>
                  </tr>
                ) : (
                  monthlyData?.daily_aggregates?.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{formatDate(m.attendance_date)}</td>
                      <td><span className="badge badge-present">{m.attended_count} Students</span></td>
                      <td>{m.present_count}</td>
                      <td>{m.late_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
