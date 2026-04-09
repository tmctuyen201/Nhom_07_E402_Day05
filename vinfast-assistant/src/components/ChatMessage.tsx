import React, { useState } from 'react';
import type { AgentMessage } from '../types/agent';

// ── Styles (inline, co-located) ───────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '16px',
    animation: 'fadeInUp 0.35s ease-out both',
  },
  wrapperUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    padding: '14px 18px',
    borderRadius: '18px',
    lineHeight: 1.65,
    fontSize: '0.9375rem',
    wordBreak: 'break-word',
    position: 'relative',
    whiteSpace: 'pre-wrap',
  },
  bubbleUser: {
    background: 'linear-gradient(135deg, #0066cc 0%, #004999 100%)',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
    boxShadow: '0 4px 16px rgba(0, 102, 204, 0.35)',
  },
  bubbleAssistant: {
    background: 'linear-gradient(135deg, #1a2235 0%, #151d30 100%)',
    color: '#f0f4ff',
    borderBottomLeftRadius: '4px',
    border: '1px solid rgba(0, 212, 255, 0.12)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
  },
  bubbleError: {
    background: 'linear-gradient(135deg, #2a0a12 0%, #1e0710 100%)',
    color: '#ff8a9e',
    border: '1px solid rgba(200, 16, 46, 0.3)',
    borderBottomLeftRadius: '4px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '6px',
    padding: '0 4px',
  },
  agentTag: {
    fontSize: '0.7rem',
    fontFamily: 'JetBrains Mono, monospace',
    padding: '2px 8px',
    borderRadius: '20px',
    fontWeight: 500,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  agentTagColor: {
    background: 'rgba(0, 212, 255, 0.1)',
    color: '#00d4ff',
    border: '1px solid rgba(0, 212, 255, 0.2)',
  },
  confidenceBadge: {
    fontSize: '0.7rem',
    fontFamily: 'JetBrains Mono, monospace',
    padding: '2px 8px',
    borderRadius: '20px',
    fontWeight: 500,
  },
  feedbackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  feedbackBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#8899b4',
    transition: 'all 0.15s',
  },
  sourcesSection: {
    marginTop: '12px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 212, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.25)',
  },
  sourcesHeader: {
    padding: '8px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#8899b4',
    userSelect: 'none',
  },
  sourcesList: {
    padding: '8px 14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sourceItem: {
    fontSize: '0.78rem',
    color: '#8899b4',
    padding: '6px 10px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderLeft: '3px solid #00d4ff',
  },
  safetyBanner: {
    marginTop: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(200, 16, 46, 0.1)',
    border: '1px solid rgba(200, 16, 46, 0.3)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '0.85rem',
    color: '#ff8a9e',
  },
  typingDots: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 0',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#00d4ff',
  },
  typingText: {
    fontSize: '0.8rem',
    color: '#8899b4',
    marginLeft: '8px',
    fontStyle: 'italic',
  },
};

// ── Agent type label map ─────────────────────────────────────
const AGENT_LABELS: Record<string, string> = {
  orchestrator: 'VinFast Assistant',
  retrieval:    'RAG Retrieval',
  vision:       'Vision Analysis',
  safety:       'Safety Check',
};

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.8) return 'confidence-high';
  if (confidence >= 0.5) return 'confidence-medium';
  return 'confidence-low';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'Cao';
  if (confidence >= 0.5) return 'Trung bình';
  return 'Thấp';
}

// ── Component ─────────────────────────────────────────────────
interface ChatMessageProps {
  message: AgentMessage;
  onFeedback: (messageId: string, vote: 'up' | 'down') => void;
  showSources: boolean;
  onToggleSources: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onFeedback,
  showSources,
  onToggleSources,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [hovered, setHovered] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.isError ?? false;
  const isTyping = !isUser && !message.content && !isError;
  const hasSources = Boolean(message.sources && message.sources.length > 0);
  const isSafety = message.isSafetyWarning;

  const handleFeedback = (vote: 'up' | 'down') => {
    if (feedbackGiven) return;
    setFeedbackGiven(vote);
    onFeedback(message.id, vote);
  };

  // ── Typing indicator ──
  if (isTyping) {
    return (
      <div style={{ ...styles.wrapper, ...styles.wrapper }}>
        <div style={{ ...styles.bubble, ...styles.bubbleAssistant }}>
          <div style={styles.typingDots}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  ...styles.dot,
                  animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <span style={styles.typingText}>
            VinFast Assistant đang suy nghĩ...
          </span>
        </div>
      </div>
    );
  }

  const bubbleStyle: React.CSSProperties = {
    ...styles.bubble,
    ...(isUser
      ? styles.bubbleUser
      : isError
      ? styles.bubbleUser // treat error like user for visibility
      : styles.bubbleAssistant),
    ...(isError ? { background: 'linear-gradient(135deg, #2a0a12, #1e0710)', border: '1px solid rgba(200,16,46,0.35)', color: '#ff8a9e' } : {}),
  };

  return (
    <div
      style={{
        ...styles.wrapper,
        ...(isUser ? styles.wrapperUser : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Bubble */}
      <div style={bubbleStyle}>
        {/* Safety warning banner */}
        {isSafety && (
          <div style={styles.safetyBanner}>
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <span>
              <strong>Cảnh báo an toàn: </strong>
              Hành động này có thể nguy hiểm. Vui lòng tham khảo hướng dẫn sử dụng chính thức.
            </span>
          </div>
        )}
        {message.content}
      </div>

      {/* Meta row: agent tag + confidence + timestamp */}
      {!isUser && (
        <div style={styles.meta}>
          {message.agentType && (
            <span
              style={{
                ...styles.agentTag,
                ...styles.agentTagColor,
              }}
            >
              {AGENT_LABELS[message.agentType] ?? message.agentType}
            </span>
          )}
          {typeof message.confidence === 'number' && (
            <span
              style={{
                ...styles.confidenceBadge,
              }}
              className={getConfidenceClass(message.confidence)}
            >
              Độ tin cậy: {getConfidenceLabel(message.confidence)}
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: '#4a5568' }}>
            {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* Sources accordion */}
      {!isUser && hasSources && (
        <div style={styles.sourcesSection}>
          <div
            style={styles.sourcesHeader}
            onClick={onToggleSources}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onToggleSources()}
          >
            <span>
              📄 Nguồn tham khảo ({message.sources!.length})
            </span>
            <span style={{ transition: 'transform 0.2s', transform: showSources ? 'rotate(180deg)' : 'none' }}>
              ▾
            </span>
          </div>
          {showSources && (
            <div style={styles.sourcesList}>
              {message.sources!.map((src, idx) => (
                <div key={idx} style={styles.sourceItem}>
                  <strong style={{ color: '#00d4ff' }}>
                    {src.pageNumber ?? `Trang ${idx + 1}`}
                  </strong>
                  {(src.chapter || src.section) && (
                    <span style={{ marginLeft: '8px', color: '#c0c8d8' }}>
                      — {src.chapter}{src.section ? ` / ${src.section}` : ''}
                    </span>
                  )}
                  {src.excerpt && (
                    <div style={{ fontSize: '0.72rem', color: '#8899b4', marginTop: '2px', fontStyle: 'italic' }}>
                      "{src.excerpt.length > 80 ? src.excerpt.slice(0, 80) + '…' : src.excerpt}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback buttons */}
      {!isUser && (
        <div
          style={{
            ...styles.feedbackRow,
            opacity: hovered || feedbackGiven ? 1 : 0,
          }}
        >
          {feedbackGiven ? (
            <span style={{ fontSize: '0.75rem', color: feedbackGiven === 'up' ? '#00e676' : '#ff4d6a' }}>
              {feedbackGiven === 'up' ? '👍 Cảm ơn phản hồi của bạn' : '👎 Đã ghi nhận'}
            </span>
          ) : (
            <>
              <button
                style={styles.feedbackBtn}
                onClick={() => handleFeedback('up')}
                title="Hữu ích"
                onMouseOver={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 230, 118, 0.12)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#00e676';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0, 230, 118, 0.3)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.06)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                👍 Hữu ích
              </button>
              <button
                style={styles.feedbackBtn}
                onClick={() => handleFeedback('down')}
                title="Không hữu ích"
                onMouseOver={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 77, 106, 0.12)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ff4d6a';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 77, 106, 0.3)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.06)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                👎 Cần cải thiện
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
