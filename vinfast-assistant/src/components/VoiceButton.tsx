import React from 'react';

type VoiceState = 'idle' | 'wake-listening' | 'recording';

interface VoiceButtonProps {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
}

const STATE_CONFIG: Record<VoiceState, { color: string; bg: string; border: string; title: string; pulse: boolean }> = {
  'idle':           { color: '#8899b4', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', title: 'Nhấn để nói',           pulse: false },
  'wake-listening': { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.25)',   title: 'Đang chờ "Hey VinFast"', pulse: true  },
  'recording':      { color: '#ff4d6a', bg: 'rgba(255,77,106,0.15)',  border: 'rgba(255,77,106,0.4)',   title: 'Đang nghe... (nhấn để dừng)', pulse: true },
};

export const VoiceButton: React.FC<VoiceButtonProps> = ({ state, onClick, disabled }) => {
  const cfg = STATE_CONFIG[state];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={cfg.title}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '10px',
        padding: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: cfg.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        opacity: disabled ? 0.4 : 1,
        position: 'relative',
        boxShadow: cfg.pulse ? `0 0 12px ${cfg.color}44` : 'none',
        animation: cfg.pulse ? 'glowPulse 1.5s ease-in-out infinite' : 'none',
      }}
      onMouseOver={e => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = `${cfg.color}22`;
          (e.currentTarget as HTMLButtonElement).style.borderColor = `${cfg.color}66`;
        }
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLButtonElement).style.background = cfg.bg;
        (e.currentTarget as HTMLButtonElement).style.borderColor = cfg.border;
      }}
    >
      {state === 'recording' ? (
        // Stop icon when recording
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      ) : (
        // Mic icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )}
    </button>
  );
};
