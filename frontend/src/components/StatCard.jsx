import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtext }) {
  const colorMap = {
    primary: {
      bg: '#eef2ff',
      iconColor: '#4f46e5',
      border: '#e0e7ff'
    },
    success: {
      bg: '#ecfdf5',
      iconColor: '#10b981',
      border: '#d1fae5'
    },
    warning: {
      bg: '#fffbeb',
      iconColor: '#f59e0b',
      border: '#fef3c7'
    },
    danger: {
      bg: '#fef2f2',
      iconColor: '#ef4444',
      border: '#fee2e2'
    }
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          {title}
        </p>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
          {value !== undefined && value !== null ? value : '—'}
        </h3>
        {subtext && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {subtext}
          </p>
        )}
      </div>

      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: scheme.bg,
        border: `1px solid ${scheme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: scheme.iconColor,
        flexShrink: 0
      }}>
        {Icon && <Icon size={22} />}
      </div>
    </div>
  );
}
