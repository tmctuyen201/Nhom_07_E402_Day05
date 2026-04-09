import React from 'react';

interface WakeWordIndicatorProps {
  isActive: boolean;
  isSupported: boolean;
  enabled: boolean;
  onToggle: () => void;
}

export const WakeWordIndicator: React.FC<WakeWordIndicatorProps> = ({
  isActive, isSupported, enabled, onToggle,
}) => {
  if (!isSupported) return null;

  return (
    <button
      onClick={onToggle}
      title={enabled ? (isActive ? 'Đang lắng nghe "Hey VinFast" — nhấn để tắt' : 'Wake word đang khởi động...') : 'Bật wake word "Hey VinFast"'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: enabled
          ? isActive ? 'rgba(0,212,255,0.1)' : 'rgba(0,212,255,0.05)'
          : 'rgba(255,255,255,0.04)',
        border: enabled
          ? `1px solid rgba(0,212,255,${isActive ? '0.35' : '0.15'})`
          : '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <span style={{
        fontSize: '0.65rem',
        animation: enabled && isActive ? 'glowPulse 2s ease-in-out infinite' : 'none',
      }}>
        🎙️
      </span>
      <span style={{
        fontSize: '0.68rem',
        fontWeight: 500,
        color: enabled ? (isActive ? '#00d4ff' : '#8899b4') : '#4a5568',
      }}>
        {enabled ? (isActive ? 'Listening' : '...') : 'Wake'}
      </span>
    </button>
  );
};
