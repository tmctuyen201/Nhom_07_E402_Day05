import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAgent } from './hooks/useAgent';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { CarModelSelector } from './components/CarModelSelector';
import { QuickActions } from './components/QuickActions';
import { SettingsPanel } from './components/SettingsPanel';
import type { AgentMessage } from './types/agent';

// ── Inline Styles ─────────────────────────────────────────────
const appStyle: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(180deg, #0a0f1a 0%, #060a12 100%)',
  overflow: 'hidden',
};

// ── HEADER ───────────────────────────────────────────────────
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  background: 'rgba(10, 15, 26, 0.9)',
  borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  flexShrink: 0,
  zIndex: 50,
  position: 'relative',
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const logoIconStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #c8102e 0%, #8a0b20 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  boxShadow: '0 4px 16px rgba(200, 16, 46, 0.4)',
};

const logoTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const logoTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 800,
  color: '#f0f4ff',
  letterSpacing: '-0.01em',
  lineHeight: 1.2,
};

const logoSubStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: '#c8102e',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const settingsBtnStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#8899b4',
  fontSize: '1rem',
  transition: 'all 0.2s',
};

// ── API KEY BANNER ───────────────────────────────────────────
const apiBannerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(200,16,46,0.15) 0%, rgba(200,16,46,0.05) 100%)',
  borderBottom: '1px solid rgba(200,16,46,0.2)',
  padding: '10px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexShrink: 0,
  animation: 'slideDown 0.3s ease-out',
};

const apiInputStyle: React.CSSProperties = {
  flex: 1,
  background: '#0f1623',
  border: '1px solid rgba(200,16,46,0.3)',
  borderRadius: '10px',
  padding: '8px 14px',
  color: '#f0f4ff',
  fontSize: '0.875rem',
  fontFamily: 'JetBrains Mono, monospace',
  maxWidth: '480px',
};

// ── CHAT AREA ─────────────────────────────────────────────────
const chatAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '20px 16px',
  display: 'flex',
  flexDirection: 'column',
  scrollBehavior: 'smooth',
};

const emptyStateStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  padding: '40px 20px',
  textAlign: 'center',
  animation: 'fadeIn 0.5s ease-out',
};

const emptyIconStyle: React.CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: '20px',
  background: 'linear-gradient(135deg, rgba(200,16,46,0.15) 0%, rgba(0,212,255,0.1) 100%)',
  border: '1px solid rgba(0,212,255,0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 700,
  color: '#f0f4ff',
};

const emptySubStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#8899b4',
  maxWidth: '360px',
  lineHeight: 1.6,
};

const emptyFeaturesStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'center',
  maxWidth: '440px',
};

const featureChipStyle = (color: string): React.CSSProperties => ({
  padding: '5px 12px',
  borderRadius: '20px',
  fontSize: '0.78rem',
  fontWeight: 500,
  background: `${color}18`,
  border: `1px solid ${color}33`,
  color,
});

// ── RATE LIMIT NOTICE ────────────────────────────────────────
const rateLimitStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '90px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'linear-gradient(135deg, #1a0a0a, #2a0a12)',
  border: '1px solid rgba(200,16,46,0.4)',
  borderRadius: '12px',
  padding: '10px 20px',
  color: '#ff8a9e',
  fontSize: '0.85rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  boxShadow: '0 4px 24px rgba(200,16,46,0.25)',
  zIndex: 200,
  animation: 'fadeInUp 0.3s ease-out',
};

// ── App Component ─────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => {
    return sessionStorage.getItem('vf_api_key') ?? '';
  });
  const [carModel, setCarModel] = useState<string>('VF8');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [imageData, setImageData] = useState<string | undefined>();
  const [currentCategory, setCurrentCategory] = useState<string | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, rateLimitCountdown, sessionId, sendMessage, clearChat } =
    useAgent({ apiKey, carModel });

  // Persist API key in sessionStorage
  useEffect(() => {
    sessionStorage.setItem('vf_api_key', apiKey);
  }, [apiKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTo({
        top: chatAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSend = useCallback(
    (query: string, img?: string) => {
      sendMessage(query, img);
      setImageData(undefined);
      // Auto-detect category from query
      const q = query.toLowerCase();
      if (q.includes('đèn') || q.includes('cảnh báo')) setCurrentCategory('safety');
      else if (q.includes('sạc') || q.includes('pin')) setCurrentCategory('charging');
      else if (q.includes('adas')) setCurrentCategory('adas');
      else if (q.includes('bảo dưỡng')) setCurrentCategory('maintenance');
    },
    [sendMessage]
  );

  const handleFeedback = useCallback((messageId: string, vote: 'up' | 'down') => {
    // In a real app, send feedback to backend
    console.log(`Feedback on ${messageId}: ${vote}`);
  }, []);

  const handleToggleSources = useCallback((messageId: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  const hasApiKey = apiKey.trim().length > 0;

  return (
    <div style={appStyle}>
      {/* ── Header ─────────────────────────────────────── */}
      <header style={headerStyle}>
        <div style={logoStyle}>
          <div style={logoIconStyle}>🚗</div>
          <div style={logoTextStyle}>
            <span style={logoTitleStyle}>VinFast Assistant</span>
            <span style={logoSubStyle}>AI-powered · RAG</span>
          </div>
        </div>

        <div style={headerRightStyle}>
          {/* Model selector */}
          <CarModelSelector selected={carModel} onChange={setCarModel} />

          {/* Status dot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '20px',
              background: hasApiKey ? 'rgba(0,230,118,0.08)' : 'rgba(255,77,106,0.08)',
              border: hasApiKey
                ? '1px solid rgba(0,230,118,0.2)'
                : '1px solid rgba(255,77,106,0.2)',
            }}
            title={hasApiKey ? 'API key đã được cung cấp' : 'Cần nhập API key'}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: hasApiKey ? '#00e676' : '#ff4d6a',
                boxShadow: hasApiKey
                  ? '0 0 6px rgba(0,230,118,0.8)'
                  : '0 0 6px rgba(255,77,106,0.8)',
                animation: hasApiKey ? 'glowPulse 2s ease-in-out infinite' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                color: hasApiKey ? '#00e676' : '#ff4d6a',
                fontWeight: 500,
              }}
            >
              {hasApiKey ? 'Online' : 'Chưa kết nối'}
            </span>

            {/* Session info chip */}
            <div
              title={`Session: ${sessionId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '20px',
                background: 'rgba(0,212,255,0.06)',
                border: '1px solid rgba(0,212,255,0.15)',
                fontSize: '0.68rem',
                color: '#00d4ff',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              💬 {messages.length}
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="Xóa lịch sử chat"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 1px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: 'rgba(0,212,255,0.5)',
                    lineHeight: 1,
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ff4d6a'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,212,255,0.5)'; }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Settings button */}
          <button
            style={settingsBtnStyle}
            onClick={() => setShowSettings(v => !v)}
            title="Cài đặt"
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.1)';
              (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.3)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* ── API Key Banner (if missing) ────────────────── */}
      {!hasApiKey && (
        <div style={apiBannerStyle}>
          <span style={{ fontSize: '1.1rem' }}>🔑</span>
          <span style={{ flex: 1, fontSize: '0.875rem', color: '#ff8a9e', fontWeight: 500 }}>
            Cần API key OpenAI để sử dụng assistant
          </span>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Nhập API key (sk-...)"
            style={apiInputStyle}
          />
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'rgba(200,16,46,0.15)',
              border: '1px solid rgba(200,16,46,0.3)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#c8102e',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Cài đặt
          </button>
        </div>
      )}

      {/* ── Quick Actions ───────────────────────────────── */}
      <QuickActions
        onAction={q => handleSend(q)}
        currentCategory={currentCategory}
      />

      {/* ── Chat Area ──────────────────────────────────── */}
      <div ref={chatAreaRef} style={chatAreaStyle}>
        {/* Empty state */}
        {messages.length === 0 && (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>🤖</div>
            <div style={emptyTitleStyle}>Chào bạn! 👋</div>
            <div style={emptySubStyle}>
              Tôi là trợ lý xe VinFast thông minh. Hãy hỏi tôi bất cứ điều gì về xe của bạn
              — từ đèn cảnh báo, sạc pin, tính năng ADAS, đến lịch bảo dưỡng.
            </div>
            <div style={emptyFeaturesStyle}>
              {[
                { label: '⚠️ Đèn cảnh báo', color: '#ffb300' },
                { label: '🔋 Sạc pin', color: '#00e676' },
                { label: '🤖 ADAS', color: '#00d4ff' },
                { label: '🛡️ An toàn', color: '#c8102e' },
                { label: '🔧 Bảo dưỡng', color: '#a78bfa' },
              ].map(f => (
                <span key={f.label} style={featureChipStyle(f.color)}>
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onFeedback={handleFeedback}
            showSources={expandedSources.has(msg.id)}
            onToggleSources={() => handleToggleSources(msg.id)}
          />
        ))}

        {/* Error display */}
        {error && !isLoading && (
          <div
            style={{
              margin: '12px 0',
              padding: '12px 16px',
              background: 'rgba(255,77,106,0.08)',
              border: '1px solid rgba(255,77,106,0.2)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: '#ff8a9e',
              animation: 'fadeInUp 0.3s ease-out',
            }}
          >
            <strong>⚠️ Lỗi: </strong>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Rate Limit Notice ───────────────────────────── */}
      {rateLimitCountdown > 0 && (
        <div style={rateLimitStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Đang chờ rate limit... {rateLimitCountdown}s
        </div>
      )}

      {/* ── Input Area ─────────────────────────────────── */}
      <ChatInput
        onSend={handleSend}
        onImageSelect={setImageData}
        disabled={!hasApiKey}
        isLoading={isLoading}
      />

      {/* ── Settings Panel ──────────────────────────────── */}
      {showSettings && (
        <SettingsPanel
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
