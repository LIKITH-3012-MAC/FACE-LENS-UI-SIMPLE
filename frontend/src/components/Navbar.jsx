import React, { useState, useEffect } from 'react';
import { ShieldCheck, Video, Database, Clock, Wifi, WifiOff } from 'lucide-react';
import { getHealth } from '../services/api';

export default function Navbar() {
  const [health, setHealth] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Clock interval
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Initial health check
    const checkSystem = async () => {
      try {
        const res = await getHealth();
        setHealth(res.data);
      } catch (err) {
        setHealth({ database: { connected: false } });
      }
    };

    checkSystem();
    const healthInterval = setInterval(checkSystem, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(healthInterval);
    };
  }, []);

  const isDbConnected = health?.database?.connected;

  return (
    <header style={{
      height: '68px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
        }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
            Smart Attendance System
          </h1>
          <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
            Face Recognition & Automated Attendance Engine
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Real-time Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          padding: '0.35rem 0.75rem',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <Clock size={15} color="var(--primary)" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Cloud MySQL Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: isDbConnected ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: isDbConnected ? '#065f46' : '#991b1b',
          border: `1px solid ${isDbConnected ? '#a7f3d0' : '#fecaca'}`
        }}>
          <Database size={13} />
          <span>{isDbConnected ? 'Cloud MySQL Connected' : 'DB Disconnected'}</span>
          {isDbConnected && <span className="pulse-indicator" />}
        </div>
      </div>
    </header>
  );
}
