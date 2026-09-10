/**
 * Utility formatters for dates, times, and metrics
 */

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString) {
  if (!timeString) return '—';
  // Check if string is HH:MM:SS
  const parts = String(timeString).split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeString;
}

export function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  return `${Number(value).toFixed(1)}%`;
}

export function getStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'present') {
    return { className: 'badge badge-present', label: 'Present' };
  } else if (s === 'late') {
    return { className: 'badge badge-late', label: 'Late' };
  } else if (s === 'absent') {
    return { className: 'badge badge-absent', label: 'Absent' };
  }
  return { className: 'badge badge-unknown', label: status || 'Unknown' };
}
