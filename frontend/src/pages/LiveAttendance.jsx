import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Play,
  Square,
  RefreshCw,
  UserCheck,
  HelpCircle,
  Clock,
  ShieldCheck,
  Video,
  Monitor,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  UserX,
  Mail,
  MapPin,
  Calendar,
  BarChart3,
  Check
} from 'lucide-react';
import {
  getLiveStatus,
  getTodayAttendance,
  getLiveStreamUrl,
  recognizeFrame,
  markAttendance
} from '../services/api';
import { formatTime, getStatusBadge } from '../utils/formatters';
import Toast from '../components/Toast';

export default function LiveAttendance() {
  // Mode: 'browser_camera' (laptop/client webcam) or 'backend_stream' (direct OpenCV on server)
  const [cameraSource, setCameraSource] = useState('browser_camera');
  
  // Attendance Mode: 'automatic' or 'manual'
  const [attendanceMode, setAttendanceMode] = useState('manual');
  const attendanceModeRef = useRef('manual');

  const [isStreaming, setIsStreaming] = useState(false);
  const [markedToday, setMarkedToday] = useState([]);
  const [unknownCount, setUnknownCount] = useState(0);
  const [liveDetections, setLiveDetections] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [toast, setToast] = useState(null);
  const [markingStudentId, setMarkingStudentId] = useState(null);

  // GPS Location State with accuracy
  const [geoCoords, setGeoCoords] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    status: 'requesting'
  });
  const geoCoordsRef = useRef({ latitude: null, longitude: null, accuracy: null });

  // Browser Camera Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const browserLoopRef = useRef(null);

  // Keep attendanceModeRef in sync
  useEffect(() => {
    attendanceModeRef.current = attendanceMode;
  }, [attendanceMode]);

  // Request browser geolocation for attendance verification
  const acquireLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            status: 'active'
          };
          setGeoCoords(coords);
          geoCoordsRef.current = coords;
        },
        (err) => {
          console.warn('GPS location access denied or unavailable:', err.message);
          setGeoCoords({ latitude: null, longitude: null, accuracy: null, status: 'denied' });
          geoCoordsRef.current = { latitude: null, longitude: null, accuracy: null };
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    } else {
      setGeoCoords({ latitude: null, longitude: null, accuracy: null, status: 'unavailable' });
    }
  };

  useEffect(() => {
    acquireLocation();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch today's attendance records from Cloud MySQL
  const fetchTodayList = async () => {
    try {
      const res = await getTodayAttendance();
      setMarkedToday(res.data || []);
      const statusRes = await getLiveStatus();
      setUnknownCount(statusRes.data?.unknown_face_count || 0);
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    }
  };

  useEffect(() => {
    fetchTodayList();
  }, []);

  // Poll live status when backend stream is active
  useEffect(() => {
    if (isStreaming && cameraSource === 'backend_stream') {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await getLiveStatus();
          setUnknownCount(res.data?.unknown_face_count || 0);
          fetchTodayList();
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isStreaming, cameraSource]);

  // Manual Attendance Confirmation Handler (Section 1, 2, 22, 24)
  const handleManualMark = async (student) => {
    if (markingStudentId) return;

    setMarkingStudentId(student.student_id);
    try {
      const payload = {
        student_id: student.student_id,
        face_distance: typeof student.distance === 'number' ? student.distance : 0.38,
        latitude: geoCoordsRef.current.latitude,
        longitude: geoCoordsRef.current.longitude,
        location_accuracy: geoCoordsRef.current.accuracy
      };

      const res = await markAttendance(payload);
      if (res.success && res.data) {
        const rec = res.data;
        const emailTag = rec.email_notification === 'sent'
          ? ' • ✉️ Email Sent'
          : (rec.email_notification === 'failed' ? ' • ⚠️ Email Delivery Failed' : '');
        
        showToast(`Attendance Marked Successfully ✓ • ${student.name} • Today's Count: ${rec.today_count ?? 1}${emailTag}`, 'success');
        
        await fetchTodayList();

        // Update live detections to immediately reflect attendance marked
        setLiveDetections(prev => prev.map(d => {
          if (d.student_id === student.student_id) {
            return {
              ...d,
              already_marked_today: true,
              today_count: rec.today_count ?? 1,
              total_attendance_count: rec.total_attendance_count ?? (d.total_attendance_count + 1),
              last_attendance_time: rec.attendance_time || rec.time || d.last_attendance_time
            };
          }
          return d;
        }));
      } else {
        showToast(res.message || 'Could not mark attendance', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to record attendance', 'error');
    } finally {
      setMarkingStudentId(null);
    }
  };

  // Browser Webcam Engine
  const startBrowserCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.log('Autoplay handled:', err));
      }
      setIsStreaming(true);
      showToast(`Camera active in ${attendanceModeRef.current === 'automatic' ? 'Automatic' : 'Manual'} Mode`, 'success');

      // Clear any prior loop
      if (browserLoopRef.current) clearInterval(browserLoopRef.current);

      // Start Recognition Frame Loop
      browserLoopRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);

        const isAuto = attendanceModeRef.current === 'automatic';

        try {
          const res = await recognizeFrame(
            base64,
            isAuto,
            geoCoordsRef.current.latitude,
            geoCoordsRef.current.longitude,
            geoCoordsRef.current.accuracy
          );

          if (res.success && res.data) {
            const detections = res.data.detections || [];
            setLiveDetections(detections);
            setUnknownCount(res.data.unknown_face_count || 0);

            // In Automatic mode, notify if any student was auto-marked
            if (isAuto) {
              const newMarks = detections.filter(d => d.attendance?.success);
              if (newMarks && newMarks.length > 0) {
                fetchTodayList();
                newMarks.forEach(m => {
                  const emailStatus = m.attendance?.record?.email_notification;
                  const emailTag = emailStatus === 'sent'
                    ? ' • ✉️ Email Sent'
                    : (emailStatus === 'failed' ? ' • ⚠️ Email Delivery Failed' : '');
                  showToast(`✓ Marked attendance for ${m.name}${emailTag}`, 'success');
                });
              }
            }
          }
        } catch (e) {
          // Silent frame catch
        }
      }, 750); // Process frame every 750ms

    } catch (err) {
      setCameraError(err.message || 'Permission denied or webcam busy');
      showToast(`Cannot access webcam: ${err.message}`, 'error');
      setIsStreaming(false);
    }
  };

  const stopBrowserCamera = () => {
    if (browserLoopRef.current) {
      clearInterval(browserLoopRef.current);
      browserLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setLiveDetections([]);
    setIsStreaming(false);
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopBrowserCamera();
    };
  }, []);

  const handleStart = () => {
    if (cameraSource === 'browser_camera') {
      startBrowserCamera();
    } else {
      setIsStreaming(true);
      showToast('Backend OpenCV camera stream connected', 'success');
    }
  };

  const handleStop = () => {
    if (cameraSource === 'browser_camera') {
      stopBrowserCamera();
    } else {
      setIsStreaming(false);
    }
    showToast('Live stream stopped', 'info');
  };

  // Filter recognized vs unknown detections
  const recognizedDetections = liveDetections.filter(d => d.recognized && d.student_id);
  const unknownDetections = liveDetections.filter(d => !d.recognized);

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Live Automated Attendance
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
              Sakra-Lens 128-D
            </span>
          </h1>
          <p className="page-subtitle">
            Biometric Face Verification Engine • Cloud MySQL • Resend Notifications
          </p>
        </div>

        {/* Header Controls: GPS Chip & Camera Source Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Live GPS Status Chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.78rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: geoCoords.status === 'active' ? '#ecfdf5' : '#fef2f2',
            color: geoCoords.status === 'active' ? '#065f46' : '#991b1b',
            border: `1px solid ${geoCoords.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
            fontWeight: 600
          }}>
            <MapPin size={14} />
            <span>
              {geoCoords.status === 'active'
                ? `GPS: ${geoCoords.latitude.toFixed(4)}, ${geoCoords.longitude.toFixed(4)} (±${geoCoords.accuracy ? Math.round(geoCoords.accuracy) + 'm' : '—'})`
                : geoCoords.status === 'denied'
                ? 'GPS: Denied (Please allow location)'
                : 'GPS: Acquiring...'}
            </span>
          </div>

          {/* Camera Source Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            gap: '0.25rem'
          }}>
            <button
              onClick={() => {
                if (isStreaming) stopBrowserCamera();
                setCameraSource('browser_camera');
              }}
              className={`btn btn-sm ${cameraSource === 'browser_camera' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              <Monitor size={14} /> Laptop Webcam (Recommended)
            </button>
            <button
              onClick={() => {
                if (isStreaming) stopBrowserCamera();
                setCameraSource('backend_stream');
              }}
              className={`btn btn-sm ${cameraSource === 'backend_stream' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              <Video size={14} /> Server OpenCV Stream
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Mode Selector Bar (Section 14 & 23) */}
      <div className="card" style={{
        padding: '0.85rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        borderLeft: '4px solid var(--primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Attendance Mode:
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              fontWeight: attendanceMode === 'automatic' ? 700 : 500,
              color: attendanceMode === 'automatic' ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              <input
                type="radio"
                name="attendanceMode"
                value="automatic"
                checked={attendanceMode === 'automatic'}
                onChange={() => {
                  setAttendanceMode('automatic');
                  showToast('Switched to Automatic Attendance Mode', 'info');
                }}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span>Automatic Attendance</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              fontWeight: attendanceMode === 'manual' ? 700 : 500,
              color: attendanceMode === 'manual' ? '#059669' : 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              <input
                type="radio"
                name="attendanceMode"
                value="manual"
                checked={attendanceMode === 'manual'}
                onChange={() => {
                  setAttendanceMode('manual');
                  showToast('Switched to Manual "Click Attendance" Mode', 'info');
                }}
                style={{ accentColor: '#059669', cursor: 'pointer' }}
              />
              <span>Manual "Click Attendance" Button</span>
            </label>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {attendanceMode === 'automatic' ? (
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              ⚡ Recognized faces are auto-logged immediately to Cloud MySQL
            </span>
          ) : (
            <span style={{ color: '#059669', fontWeight: 600 }}>
              👆 Face is identified first → Click student's button to record attendance
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Left = Video Feed & Detected Person Card, Right = Attendance Feed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 1fr) 380px',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Camera Feed + Detected Person Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Camera Stream Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.125rem' }}>Video Feed</h3>
                {isStreaming && (
                  <span className="badge badge-present" style={{ fontSize: '0.7rem' }}>
                    <span className="pulse-indicator" /> ACTIVE
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Source: <strong>{cameraSource === 'browser_camera' ? 'Laptop Webcam' : 'Server OpenCV'}</strong>
              </div>
            </div>

            {/* Video Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '440px',
              backgroundColor: '#090d16',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--border-color)'
            }}>
              {/* Mode 1: Backend MJPEG Stream */}
              {cameraSource === 'backend_stream' && isStreaming && (
                <img
                  src={getLiveStreamUrl()}
                  alt="OpenCV Live Camera Stream"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              {/* Mode 2: Browser Camera */}
              {cameraSource === 'browser_camera' && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: isStreaming ? 'block' : 'none'
                  }}
                />
              )}

              {/* Browser Mode Overlay Bounding Boxes */}
              {cameraSource === 'browser_camera' && isStreaming && liveDetections.map((det, idx) => {
                const [x, y, w, h] = det.bbox;
                const leftPct = (x / 640) * 100;
                const topPct = (y / 480) * 100;
                const widthPct = (w / 640) * 100;
                const heightPct = (h / 480) * 100;

                const isRec = det.recognized;
                const borderColor = isRec ? '#10b981' : '#f97316';

                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                      border: `2px solid ${borderColor}`,
                      boxShadow: `0 0 12px ${borderColor}90`,
                      pointerEvents: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '-26px',
                      left: 0,
                      backgroundColor: borderColor,
                      color: 'white',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <span>{isRec ? `✓ ${det.name}` : 'UNKNOWN'}</span>
                      <span style={{ opacity: 0.9, fontSize: '0.65rem', fontWeight: 600 }}>
                        (Dist: {typeof det.distance === 'number' ? det.distance.toFixed(2) : (det.confidence_score ?? '—')} / Tol: {det.tolerance ?? '0.50'})
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Idle or Error State Banner */}
              {!isStreaming && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  <Camera size={56} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Camera Stream Paused</h4>
                  <p style={{ fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                    {cameraError ? `Camera Access Error: ${cameraError}. Please ensure camera permissions are allowed in your browser.` : 'Click "Start Camera" below to initialize real-time face detection, recognition, and automated attendance.'}
                  </p>
                  <button onClick={handleStart} className="btn btn-primary" style={{ minWidth: '160px' }}>
                    <Play size={16} /> Start Camera
                  </button>
                </div>
              )}
            </div>

            {/* Camera Control Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {!isStreaming ? (
                  <button onClick={handleStart} className="btn btn-primary">
                    <Play size={16} /> Start
                  </button>
                ) : (
                  <button onClick={handleStop} className="btn btn-danger">
                    <Square size={16} /> Stop
                  </button>
                )}

                <button onClick={fetchTodayList} className="btn btn-secondary">
                  <RefreshCw size={16} /> Refresh Feed
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Marked Today: <strong style={{ color: 'var(--success)' }}>{markedToday.length}</strong>
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Unknown: <strong style={{ color: '#f97316' }}>{unknownCount}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* DETECTED PERSON SECTION (Section 1, 15, 16, 23, 24) */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Detected Person</h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {attendanceMode === 'manual' ? 'Manual Confirmation Mode' : 'Automatic Logging Mode'}
              </span>
            </div>

            {/* Case 1: Camera is Paused or Inactive */}
            {!isStreaming && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                <Camera size={32} style={{ opacity: 0.35, margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Camera is paused</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Start camera stream to detect and verify enrolled students.
                </p>
              </div>
            )}

            {/* Case 2: Camera active, but NO face detected at all */}
            {isStreaming && liveDetections.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                backgroundColor: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)'
              }}>
                <UserCheck size={36} style={{ opacity: 0.35, margin: '0 auto 0.75rem', color: 'var(--text-secondary)' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  No recognized person detected
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Please position your face directly inside the camera frame.
                </p>
              </div>
            )}

            {/* Case 3: Only Unknown Person(s) Detected */}
            {isStreaming && recognizedDetections.length === 0 && unknownDetections.length > 0 && (
              <div style={{
                padding: '1.25rem',
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <UserX size={36} style={{ color: '#ea580c', margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#9a3412', marginBottom: '0.25rem' }}>
                  ⚠️ Unknown Person Detected
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#c2410c' }}>
                  Face not matched with any registered profile in Cloud MySQL (Tolerance 0.50). Attendance cannot be marked.
                </p>
              </div>
            )}

            {/* Case 4: One or More Recognized Registered Student(s) (Section 15 & 16) */}
            {isStreaming && recognizedDetections.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recognizedDetections.map((det, index) => {
                  const studentAlreadyMarked = det.already_marked_today || markedToday.some(m => m.student_id === det.student_id);
                  const isMarkingThis = markingStudentId === det.student_id;

                  return (
                    <div
                      key={det.student_id || index}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: '#f8fafc',
                        border: '2px solid #10b981',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}
                    >
                      {/* Person Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '0.35rem'
                          }}>
                            <Check size={13} strokeWidth={3} /> Person Detected
                          </div>

                          <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            margin: 0,
                            letterSpacing: '-0.02em',
                            textTransform: 'uppercase'
                          }}>
                            {det.name}
                          </h3>

                          <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginTop: '0.2rem' }}>
                            {det.roll_number || det.student_id} • {det.department || 'General'} ({det.section || 'A'})
                          </p>
                        </div>

                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                          <span style={{ fontWeight: 600 }}>Distance:</span> {(typeof det.distance === 'number' ? det.distance.toFixed(2) : '0.38')}
                        </div>
                      </div>

                      {/* Attendance Counts Bar (Section 12) */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.5rem',
                        backgroundColor: '#ffffff',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.78rem'
                      }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Today's Count</span>
                          <strong style={{ fontSize: '0.95rem', color: studentAlreadyMarked ? '#059669' : '#0f172a' }}>
                            {studentAlreadyMarked ? 1 : (det.today_count ?? 0)}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Total Attendance</span>
                          <strong style={{ fontSize: '0.95rem', color: '#1e3a8a' }}>
                            {det.total_attendance_count ?? 1}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Last Attendance</span>
                          <strong style={{ fontSize: '0.8rem', color: '#334155' }}>
                            {det.last_attendance_time || 'Not marked'}
                          </strong>
                        </div>
                      </div>

                      {/* Action Button: Dynamic button with actual student name */}
                      {attendanceMode === 'manual' ? (
                        studentAlreadyMarked ? (
                          <button
                            disabled
                            style={{
                              width: '100%',
                              padding: '0.85rem',
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              backgroundColor: '#e2e8f0',
                              color: '#64748b',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              cursor: 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <CheckCircle2 size={18} color="#10b981" />
                            ✓ Attendance Already Marked Today
                          </button>
                        ) : (
                          <button
                            onClick={() => handleManualMark(det)}
                            disabled={isMarkingThis}
                            style={{
                              width: '100%',
                              padding: '0.95rem 1.25rem',
                              fontSize: '1rem',
                              fontWeight: 800,
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: isMarkingThis ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.65rem',
                              letterSpacing: '0.01em',
                              boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3), 0 2px 4px -1px rgba(5, 150, 105, 0.2)',
                              transition: 'transform 0.1s ease, background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isMarkingThis) e.currentTarget.style.backgroundColor = '#047857';
                            }}
                            onMouseLeave={(e) => {
                              if (!isMarkingThis) e.currentTarget.style.backgroundColor = '#059669';
                            }}
                          >
                            {isMarkingThis ? (
                              <>
                                <RefreshCw size={18} className="spin" />
                                Marking Attendance & Dispatching Email...
                              </>
                            ) : (
                              <>
                                <Check size={20} strokeWidth={3} />
                                [ ✓ CLICK ATTENDANCE — {det.name.toUpperCase()} ]
                              </>
                            )}
                          </button>
                        )
                      ) : (
                        // Automatic Mode Status Pill
                        <div style={{
                          textAlign: 'center',
                          padding: '0.75rem',
                          backgroundColor: '#ecfdf5',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0',
                          color: '#065f46',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}>
                          <CheckCircle2 size={18} color="#059669" />
                          ✓ Attendance Auto-Marked via Sakra-Lens
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Recognized Attendees Feed */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Attendance Feed</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {markedToday.length} Record{markedToday.length === 1 ? '' : 's'} Today
              </p>
            </div>
            <span className="badge badge-present">
              {markedToday.length} Present
            </span>
          </div>

          {/* Attendees List */}
          <div style={{
            maxHeight: '520px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            {markedToday.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <UserCheck size={36} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Waiting for attendance...</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Position an enrolled student in front of camera
                </p>
              </div>
            ) : (
              markedToday.map((item) => {
                const badge = getStatusBadge(item.status);
                const hasCoords = item.latitude !== null && item.longitude !== null;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                          ✓ {item.name}
                        </span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          {item.student_id} • {item.department} ({item.section})
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className={badge.className} style={{ fontSize: '0.675rem' }}>
                          {badge.label}
                        </span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {formatTime(item.attendance_time)}
                        </p>
                      </div>
                    </div>

                    {/* Metadata strip: GPS + Email */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.7rem',
                      paddingTop: '0.35rem',
                      borderTop: '1px dashed var(--border-color)',
                      color: '#64748b'
                    }}>
                      <span>
                        {hasCoords ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <MapPin size={11} /> {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                          </span>
                        ) : (
                          '📍 GPS: Standard'
                        )}
                      </span>

                      {item.email_notification === 'sent' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#1e40af',
                          backgroundColor: '#dbeafe',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          <Mail size={11} /> Email Sent ✓
                        </span>
                      ) : item.email_notification === 'failed' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#991b1b',
                          backgroundColor: '#fee2e2',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          <Mail size={11} /> Email Failed
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>✉️ Auto-Notified</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Duplicate Prevention Guarantee Banner */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
            fontSize: '0.75rem',
            color: '#3730a3',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Duplicate Protection Active:</strong> Cloud MySQL and in-memory cache ensure one attendance record per student per day.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
