import React, { useState } from 'react';

interface SettingsPanelProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  apiKey,
  onApiKeyChange,
  onClose,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [temp, setTemp] = useState(0.3);

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '360px',
    maxWidth: '100vw',
    background: 'linear-gradient(180deg, #111827 0%, #0a0f1a 100%)',
    borderLeft: '1px solid rgba(0,212,255,0.15)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 0.3s ease-out',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#8899b4',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0f1623',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#f0f4ff',
    fontSize: '0.875rem',
    fontFamily: showKey ? 'JetBrains Mono, monospace' : 'inherit',
    transition: 'border-color 0.2s',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Panel */}
      <div style={panelStyle}>
        {/* Header */}
        <div
          style={{
            ...sectionStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '24px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#f0f4ff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: '#c8102e', fontSize: '1.2rem' }}>⚙️</span>
              Cài đặt
            </div>
            <div style={{ fontSize: '0.78rem', color: '#4a5568', marginTop: '2px' }}>
              Tùy chỉnh trải nghiệm VinFast Assistant
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: '#8899b4',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,106,0.12)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ff4d6a';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* API Key Section */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Khóa API OpenAI</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => onApiKeyChange(e.target.value)}
                placeholder="sk-..."
                style={{
                  ...inputStyle,
                  paddingRight: '44px',
                  fontFamily: showKey ? 'JetBrains Mono, monospace' : 'monospace',
                }}
              />
              <button
                onClick={() => setShowKey(v => !v)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8899b4',
                  fontSize: '0.875rem',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
              >
                {showKey ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#4a5568', marginTop: '6px' }}>
              API key được lưu trong sessionStorage và không được chia sẻ đâu
            </div>
          </div>

          {/* Model Info */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Mô hình AI</label>
            <div
              style={{
                background: 'rgba(0,212,255,0.05)',
                border: '1px solid rgba(0,212,255,0.15)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #00d4ff22, #00d4ff11)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace' }}>
                  gpt-4o-mini
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8899b4' }}>
                  OpenAI · Ngôn ngữ tự nhiên · Tốc độ cao
                </div>
              </div>
            </div>
          </div>

          {/* Temperature Slider */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Độ sáng tạo (Temperature)
              </label>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#00d4ff',
                  background: 'rgba(0,212,255,0.08)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {temp.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temp}
              onChange={e => setTemp(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#00d4ff',
                cursor: 'pointer',
                height: '4px',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: '#4a5568',
                marginTop: '4px',
              }}
            >
              <span>Chính xác</span>
              <span>Sáng tạo</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Hành động</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(200,16,46,0.1)',
                  border: '1px solid rgba(200,16,46,0.25)',
                  borderRadius: '10px',
                  color: '#ff4d6a',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,16,46,0.18)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,16,46,0.1)';
                }}
              >
                🗑️ Xóa lịch sử trò chuyện
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(0,212,255,0.07)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  borderRadius: '10px',
                  color: '#00d4ff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.12)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.07)';
                }}
              >
                📥 Xuất nhật ký phản hồi
              </button>
            </div>
          </div>

          {/* About Section */}
          <div style={{ ...sectionStyle, borderBottom: 'none' }}>
            <label style={labelStyle}>Về dự án</label>
            <div
              style={{
                background: 'rgba(200,16,46,0.06)',
                border: '1px solid rgba(200,16,46,0.15)',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>🚗</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f4ff' }}>
                    VinFast Car Assistant
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8899b4' }}>
                    RAG-powered · AI-powered · Real-time
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#8899b4', lineHeight: 1.6 }}>
                <strong style={{ color: '#c8102e' }}>Day04-Team-07-E402</strong> — Trợ lý xe
                VinFast thông minh sử dụng RAG (Retrieval-Augmented Generation) để trả lời
                câu hỏi về xe dựa trên sách hướng dẫn chính hãng.
              </div>
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.72rem',
                  color: '#4a5568',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <span>🔧 React + TypeScript</span>
                <span>⚡ Vite</span>
                <span>🤖 OpenAI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
