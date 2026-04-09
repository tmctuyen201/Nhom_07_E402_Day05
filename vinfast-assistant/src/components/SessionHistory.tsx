import React, { useState, useEffect, useCallback } from 'react';
import { loadAllSessions, deleteSession, type ChatSession } from '../lib/memory/sessions';

interface SessionHistoryProps {
  currentSessionId: string;
  onRestoreSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onClose: () => void;
}

const MODEL_COLORS: Record<string, string> = {
  VF7: '#a78bfa',
  VF8: '#00d4ff',
  VF9: '#c8102e',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(ts).toLocaleDateString('vi-VN');
}

const MODELS = ['VF7', 'VF8', 'VF9'];

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  currentSessionId,
  onRestoreSession,
  onNewChat,
  onClose,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSessions(loadAllSessions());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      deleteSession(id);
      refresh();
    },
    [refresh]
  );

  const filtered = activeModel
    ? sessions.filter(s => s.carModel === activeModel)
    : sessions;

  // Group by model for display
  const grouped: Record<string, ChatSession[]> = {};
  for (const s of filtered) {
    if (!grouped[s.carModel]) grouped[s.carModel] = [];
    grouped[s.carModel].push(s);
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '320px',
    maxWidth: '100vw',
    background: 'linear-gradient(180deg, #111827 0%, #0a0f1a 100%)',
    borderRight: '1px solid rgba(0,212,255,0.15)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInLeft 0.3s ease-out',
    boxShadow: '8px 0 40px rgba(0,0,0,0.5)',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#8899b4',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '10px',
    display: 'block',
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
            paddingTop: '22px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#f0f4ff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🕐</span>
              Lịch sử hỏi đáp
            </div>
            <div style={{ fontSize: '0.72rem', color: '#4a5568', marginTop: '2px' }}>
              {sessions.length} cuộc trò chuyện đã lưu
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

        {/* New Chat Button */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => { onNewChat(); onClose(); }}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.06))',
              border: '1px solid rgba(0,212,255,0.25)',
              borderRadius: '10px',
              color: '#00d4ff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.1))';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.06))';
            }}
          >
            ✏️ Cuộc trò chuyện mới
          </button>
        </div>

        {/* Model Filter Tabs */}
        <div
          style={{
            padding: '10px 16px',
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <button
            onClick={() => setActiveModel(null)}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeModel === null ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              background: activeModel === null ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeModel === null ? '#f0f4ff' : '#8899b4',
              transition: 'all 0.15s',
            }}
          >
            Tất cả
          </button>
          {MODELS.map(m => (
            <button
              key={m}
              onClick={() => setActiveModel(activeModel === m ? null : m)}
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeModel === m
                  ? `1px solid ${MODEL_COLORS[m]}66`
                  : '1px solid rgba(255,255,255,0.08)',
                background: activeModel === m ? `${MODEL_COLORS[m]}22` : 'transparent',
                color: activeModel === m ? MODEL_COLORS[m] : '#8899b4',
                transition: 'all 0.15s',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Session List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                gap: '12px',
                color: '#4a5568',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '2rem' }}>💬</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#8899b4' }}>
                Chưa có lịch sử
              </div>
              <div style={{ fontSize: '0.78rem' }}>
                Bắt đầu trò chuyện để lưu lịch sử
              </div>
            </div>
          ) : (
            Object.entries(grouped).map(([model, modelSessions]) => (
              <div key={model}>
                {/* Model group header */}
                <div
                  style={{
                    padding: '8px 16px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: `${MODEL_COLORS[model] ?? '#8899b4'}22`,
                      border: `1px solid ${MODEL_COLORS[model] ?? '#8899b4'}44`,
                      color: MODEL_COLORS[model] ?? '#8899b4',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {model}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#4a5568' }}>
                    {modelSessions.length} cuộc
                  </span>
                </div>

                {/* Session cards */}
                {modelSessions.map(session => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => { onRestoreSession(session); onClose(); }}
                      style={{
                        margin: '2px 10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: isActive
                          ? `${MODEL_COLORS[model] ?? '#00d4ff'}14`
                          : 'transparent',
                        border: isActive
                          ? `1px solid ${MODEL_COLORS[model] ?? '#00d4ff'}33`
                          : '1px solid transparent',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        position: 'relative',
                      }}
                      onMouseOver={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
                        }
                        const trash = (e.currentTarget as HTMLDivElement).querySelector<HTMLButtonElement>('.trash-btn');
                        if (trash) trash.style.opacity = '1';
                      }}
                      onMouseOut={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
                        }
                        const trash = (e.currentTarget as HTMLDivElement).querySelector<HTMLButtonElement>('.trash-btn');
                        if (trash) trash.style.opacity = '0';
                      }}
                    >
                      {/* Title row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            color: isActive ? '#f0f4ff' : '#c8d4e8',
                            lineHeight: 1.4,
                            flex: 1,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                          }}
                        >
                          {session.title}
                        </span>
                        {/* Trash button */}
                        <button
                          className="trash-btn"
                          onClick={e => handleDelete(e, session.id)}
                          title="Xóa"
                          style={{
                            opacity: 0,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#8899b4',
                            fontSize: '0.8rem',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            flexShrink: 0,
                            transition: 'color 0.15s, opacity 0.15s',
                            lineHeight: 1,
                          }}
                          onMouseOver={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = '#ff4d6a';
                          }}
                          onMouseOut={e => {
                            (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
                          }}
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Meta row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.7rem',
                          color: '#4a5568',
                        }}
                      >
                        <span>{timeAgo(session.lastAt)}</span>
                        <span style={{ color: '#2a3548' }}>·</span>
                        <span>{session.messages.length} tin nhắn</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.7rem',
            color: '#2a3548',
            textAlign: 'center',
          }}
        >
          Lưu tối đa 20 cuộc trò chuyện
        </div>
      </div>
    </>
  );
};
