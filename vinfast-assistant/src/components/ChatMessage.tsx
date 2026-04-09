import React, { useState } from 'react';
import type { AgentMessage, ChargingStation, ToolCallResult, MaintenanceItem } from '../types/agent';

// ── Lightweight Markdown Renderer ────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Heading ### / ## / #
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${level + 2}` as 'h3' | 'h4' | 'h5';
      elements.push(
        <Tag key={i} style={{ margin: '10px 0 4px', color: '#00d4ff', fontWeight: 600, fontSize: level === 1 ? '1rem' : '0.95rem' }}>
          {renderInline(headingMatch[2])}
        </Tag>
      );
      i++; continue;
    }

    // Numbered list block
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: '4px' }}>{renderInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ paddingLeft: '20px', margin: '6px 0' }}>{items}</ol>);
      continue;
    }

    // Bullet list block (- or *)
    if (/^[-•]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: '4px' }}>{renderInline(lines[i].replace(/^[-•]\s/, ''))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: '20px', margin: '6px 0', listStyleType: 'disc' }}>{items}</ul>);
      continue;
    }

    // Lưu ý / Note block
    if (/^(lưu ý|note|caution|warning)[:：]/i.test(line.trim())) {
      elements.push(
        <div key={i} style={{ margin: '8px 0', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 193, 7, 0.08)', borderLeft: '3px solid #ffc107', fontSize: '0.88rem', color: '#ffe082' }}>
          {renderInline(line)}
        </div>
      );
      i++; continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ margin: '4px 0', lineHeight: 1.7 }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

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

// ── Charging Station Tool Card ────────────────────────────────
function ChargingStationToolCard({ toolCall, onRetry }: { toolCall: ToolCallResult; onRetry: () => void }) {
  const { status, stations = [], error, userLocation, source, stationType = 'charging' } = toolCall;
  const label = stationType === 'service' ? 'trung tâm bảo dưỡng' : 'trạm sạc';
  const icon  = stationType === 'service' ? '🔧' : '⚡';
  const searchQuery = stationType === 'service' ? 'trung+tâm+bảo+dưỡng+VinFast' : 'trạm+sạc+VinFast';

  const mapsSearchUrl = userLocation
    ? `https://www.google.com/maps/search/${searchQuery}/@${userLocation.lat},${userLocation.lng},13z`
    : `https://www.google.com/maps/search/${searchQuery}`;

  const cardBase: React.CSSProperties = {
    marginTop: '10px',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(0,212,255,0.2)',
    background: 'rgba(0,212,255,0.04)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '10px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid rgba(0,212,255,0.1)',
    background: 'rgba(0,212,255,0.06)',
  };

  // Loading states
  if (status === 'requesting_location' || status === 'searching') {
    return (
      <div style={cardBase}>
        <div style={headerStyle}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#00d4ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>{icon}</span>
            {status === 'requesting_location' ? 'Đang lấy vị trí GPS...' : `Đang tìm ${label} gần bạn...`}
          </span>
          {userLocation && (
            <span style={{ fontSize: '0.68rem', color: '#4a5568', fontFamily: 'JetBrains Mono, monospace' }}>
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </span>
          )}
        </div>
        <div style={{ padding: '14px', display: 'flex', gap: '8px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ flex: 1, height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div style={{ ...cardBase, border: '1px solid rgba(255,77,106,0.25)', background: 'rgba(255,77,106,0.05)' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', color: '#ff8a9e' }}>⚠️ {error}</span>
          <button onClick={onRetry} style={{
            padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
            background: 'rgba(255,77,106,0.12)', border: '1px solid rgba(255,77,106,0.3)',
            color: '#ff8a9e', cursor: 'pointer',
          }}>Thử lại</button>
        </div>
      </div>
    );
  }

  // Done — render station list
  return (
    <div style={cardBase}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#00d4ff' }}>
          {icon} {stations.length} {label} VinFast gần bạn
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {source && (
            <span style={{
              fontSize: '0.65rem', padding: '2px 7px', borderRadius: '20px',
              background: source === 'serpapi' ? 'rgba(0,230,118,0.1)' : 'rgba(255,179,0,0.1)',
              border: source === 'serpapi' ? '1px solid rgba(0,230,118,0.25)' : '1px solid rgba(255,179,0,0.25)',
              color: source === 'serpapi' ? '#00e676' : '#ffb300',
            }}>
              {source === 'serpapi' ? '✓ Live' : '⚠ Static'}
            </span>
          )}
          <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" style={{
            fontSize: '0.72rem', color: '#00d4ff', textDecoration: 'none',
            padding: '3px 8px', borderRadius: '6px',
            background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
          }}>
            🗺 Xem tất cả
          </a>
        </div>
      </div>

      {/* Station list */}
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
        {stations.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#8899b4', fontSize: '0.82rem' }}>
            Không tìm thấy trạm sạc nào.{' '}
            <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff' }}>Tìm trên Maps ↗</a>
          </div>
        ) : (
          stations.map((s: ChargingStation, i: number) => <StationRow key={i} station={s} index={i} />)
        )}
      </div>
    </div>
  );
}

function StationRow({ station, index }: { station: ChargingStation; index: number }) {
  const isOpen = station.open_now?.toLowerCase().includes('open') || station.open_now?.toLowerCase().includes('mở');
  const directionsUrl = station.lat && station.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`
    : station.maps_url;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '9px 10px', borderRadius: '10px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      transition: 'border-color 0.15s',
    }}
      onMouseOver={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.2)'}
      onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'}
    >
      {/* Number */}
      <div style={{
        flexShrink: 0, width: '22px', height: '22px', borderRadius: '6px',
        background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.68rem', fontWeight: 700, color: '#00d4ff',
      }}>{index + 1}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f4ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {station.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
          {station.address && (
            <span style={{ fontSize: '0.7rem', color: '#8899b4' }}>📍 {station.address}</span>
          )}
          {station.rating && (
            <span style={{ fontSize: '0.68rem', color: '#ffb300' }}>⭐ {station.rating}</span>
          )}
          {station.open_now && (
            <span style={{
              fontSize: '0.65rem', padding: '1px 6px', borderRadius: '20px',
              background: isOpen ? 'rgba(0,230,118,0.1)' : 'rgba(255,77,106,0.1)',
              color: isOpen ? '#00e676' : '#ff4d6a',
              border: isOpen ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,77,106,0.2)',
            }}>{station.open_now}</span>
          )}
        </div>
      </div>

      {/* Directions CTA */}
      <a href={directionsUrl} target="_blank" rel="noopener noreferrer" style={{
        flexShrink: 0, padding: '6px 10px', borderRadius: '8px',
        background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.08))',
        border: '1px solid rgba(0,212,255,0.25)',
        color: '#00d4ff', fontSize: '0.72rem', fontWeight: 600,
        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
        transition: 'all 0.15s',
      }}
        onMouseOver={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(0,212,255,0.25)', borderColor: 'rgba(0,212,255,0.5)' })}
        onMouseOut={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.08))', borderColor: 'rgba(0,212,255,0.25)' })}
      >
        🗺 Chỉ đường
      </a>
    </div>
  );
}

// ── Places Search Card ────────────────────────────────────────
function PlacesCard({ toolCall }: { toolCall: ToolCallResult }) {
  const { status, places = [], keyword = '', userLocation, source, error } = toolCall;
  const isLoading = status === 'requesting_location' || status === 'searching';
  const mapsUrl = userLocation
    ? `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${userLocation.lat},${userLocation.lng},14z`
    : `https://www.google.com/maps/search/${encodeURIComponent(keyword)}`;

  const card: React.CSSProperties = {
    marginTop: '10px', borderRadius: '14px', overflow: 'hidden',
    border: '1px solid rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.04)',
  };
  const header: React.CSSProperties = {
    padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid rgba(167,139,250,0.12)', background: 'rgba(167,139,250,0.07)',
  };

  if (isLoading) return (
    <div style={card}>
      <div style={header}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>🔍</span>
          {status === 'requesting_location' ? 'Đang lấy vị trí...' : `Đang tìm "${keyword}"...`}
        </span>
      </div>
      <div style={{ padding: '12px', display: 'flex', gap: '8px' }}>
        {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: '56px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />)}
      </div>
    </div>
  );

  if (status === 'error' || error) return (
    <div style={{ ...card, border: '1px solid rgba(255,77,106,0.25)', background: 'rgba(255,77,106,0.05)' }}>
      <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#ff8a9e' }}>⚠️ {error || 'Không tìm được kết quả.'}</div>
    </div>
  );

  return (
    <div style={card}>
      <div style={header}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#a78bfa' }}>
          🔍 {places.length} kết quả cho "{keyword}"
        </span>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#a78bfa', textDecoration: 'none', padding: '3px 8px', borderRadius: '6px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}>
          🗺 Xem tất cả
        </a>
      </div>
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
        {places.length === 0
          ? <div style={{ padding: '16px', textAlign: 'center', color: '#8899b4', fontSize: '0.82rem' }}>Không tìm thấy kết quả. <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>Tìm trên Maps ↗</a></div>
          : places.map((p: ChargingStation, i: number) => <PlaceRow key={i} place={p} index={i} accentColor="#a78bfa" />)
        }
      </div>
    </div>
  );
}

function PlaceRow({ place, index, accentColor = '#00d4ff' }: { place: ChargingStation; index: number; accentColor?: string }) {
  const isOpen = place.open_now?.toLowerCase().includes('open') || place.open_now?.toLowerCase().includes('mở');
  const directionsUrl = place.lat && place.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
    : place.maps_url;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'border-color 0.15s' }}
      onMouseOver={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}33`}
      onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'}
    >
      <div style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '6px', background: `${accentColor}18`, border: `1px solid ${accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: accentColor }}>{index + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f4ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
          {place.address && <span style={{ fontSize: '0.7rem', color: '#8899b4' }}>📍 {place.address}</span>}
          {place.rating && <span style={{ fontSize: '0.68rem', color: '#ffb300' }}>⭐ {place.rating}</span>}
          {(place as any).price && <span style={{ fontSize: '0.68rem', color: '#8899b4' }}>{(place as any).price}</span>}
          {place.open_now && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '20px', background: isOpen ? 'rgba(0,230,118,0.1)' : 'rgba(255,77,106,0.1)', color: isOpen ? '#00e676' : '#ff4d6a', border: isOpen ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,77,106,0.2)' }}>{place.open_now}</span>}
        </div>
      </div>
      <a href={directionsUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '6px 10px', borderRadius: '8px', background: `${accentColor}14`, border: `1px solid ${accentColor}28`, color: accentColor, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
        onMouseOver={e => Object.assign((e.currentTarget as HTMLElement).style, { background: `${accentColor}28`, borderColor: `${accentColor}55` })}
        onMouseOut={e => Object.assign((e.currentTarget as HTMLElement).style, { background: `${accentColor}14`, borderColor: `${accentColor}28` })}
      >
        🗺 Đi
      </a>
    </div>
  );
}

// ── Directions Card ───────────────────────────────────────────
function DirectionsCard({ toolCall }: { toolCall: ToolCallResult }) {
  const { status, destination = '', display_name = '', maps_url = '', directions_found, error } = toolCall;

  const card: React.CSSProperties = {
    marginTop: '10px', borderRadius: '14px', overflow: 'hidden',
    border: '1px solid rgba(0,230,118,0.2)', background: 'rgba(0,230,118,0.04)',
  };

  if (status === 'geocoding') return (
    <div style={card}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ animation: 'spin 1.2s linear infinite', display: 'inline-block', fontSize: '1rem' }}>🧭</span>
        <span style={{ fontSize: '0.82rem', color: '#00e676' }}>Đang tìm đường đến "{destination}"...</span>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div style={{ ...card, border: '1px solid rgba(255,77,106,0.25)', background: 'rgba(255,77,106,0.05)' }}>
      <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#ff8a9e' }}>⚠️ {error}</div>
    </div>
  );

  return (
    <div style={card}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>🧭</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: '#8899b4', marginBottom: '2px' }}>Điểm đến</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>{destination}</div>
            {display_name && display_name !== destination && (
              <div style={{ fontSize: '0.72rem', color: '#8899b4', marginBottom: '8px' }}>📍 {display_name}</div>
            )}
            {!directions_found && (
              <div style={{ fontSize: '0.72rem', color: '#ffb300', marginBottom: '8px' }}>⚠️ Không tìm thấy tọa độ chính xác — sẽ tìm kiếm trên Maps</div>
            )}
            <a href={maps_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #00e676, #00c853)', border: 'none', color: '#0a0f1a', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,230,118,0.3)', transition: 'all 0.15s' }}
              onMouseOver={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(0,230,118,0.4)' })}
              onMouseOut={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'none', boxShadow: '0 4px 16px rgba(0,230,118,0.3)' })}
            >
              🗺 Mở Google Maps chỉ đường
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Battery Range Card ────────────────────────────────────────
function BatteryRangeCard({ toolCall }: { toolCall: ToolCallResult }) {
  const { battery_level = 0, range_km = 0, car_model = '', driving_mode = 'normal', advice = '', urgency = 'ok', spec } = toolCall;
  const urgencyColor = ({ critical: '#ff4d6a', warning: '#ffb300', info: '#00d4ff', ok: '#00e676' } as Record<string,string>)[urgency] ?? '#00e676';
  const pct = Math.min(100, battery_level);
  return (
    <div style={{ marginTop: '10px', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${urgencyColor}33`, background: `${urgencyColor}08` }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${urgencyColor}22`, background: `${urgencyColor}0a`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: urgencyColor }}>🔋 Battery Range — {car_model}</span>
        <span style={{ fontSize: '0.7rem', color: '#8899b4', fontFamily: 'JetBrains Mono, monospace' }}>{driving_mode} mode</span>
      </div>
      <div style={{ padding: '14px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#8899b4' }}>Mức pin</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: urgencyColor, fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</span>
          </div>
          <div style={{ height: '8px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: `linear-gradient(90deg, ${urgencyColor}88, ${urgencyColor})`, transition: 'width 0.5s ease', boxShadow: `0 0 8px ${urgencyColor}66` }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: urgencyColor, fontFamily: 'JetBrains Mono, monospace' }}>{range_km}</div>
            <div style={{ fontSize: '0.7rem', color: '#8899b4', marginTop: '2px' }}>km còn lại</div>
          </div>
          {spec && (
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8899b4', fontFamily: 'JetBrains Mono, monospace' }}>{spec.max_range_km}</div>
              <div style={{ fontSize: '0.7rem', color: '#8899b4', marginTop: '2px' }}>km tối đa</div>
            </div>
          )}
        </div>
        <div style={{ padding: '8px 12px', borderRadius: '8px', background: `${urgencyColor}10`, border: `1px solid ${urgencyColor}25`, fontSize: '0.82rem', color: urgencyColor }}>{advice}</div>
      </div>
    </div>
  );
}

// ── Maintenance Schedule Card ─────────────────────────────────
function MaintenanceCard({ toolCall }: { toolCall: ToolCallResult }) {
  const { current_km = 0, car_model = '', summary = '', items = [], overdue_count = 0, due_soon_count = 0 } = toolCall;
  const [expanded, setExpanded] = useState(false);
  const STATUS_CFG = {
    overdue:  { color: '#ff4d6a', bg: 'rgba(255,77,106,0.1)',  border: 'rgba(255,77,106,0.25)',  label: 'Quá hạn',  icon: '🔴' },
    due_soon: { color: '#ffb300', bg: 'rgba(255,179,0,0.1)',   border: 'rgba(255,179,0,0.25)',   label: 'Sắp đến',  icon: '⚠️' },
    upcoming: { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',  border: 'rgba(0,212,255,0.2)',    label: 'Sắp tới',  icon: '⏳' },
    ok:       { color: '#00e676', bg: 'rgba(0,230,118,0.08)',  border: 'rgba(0,230,118,0.2)',    label: 'Tốt',      icon: '✅' },
  };
  const headerColor = overdue_count > 0 ? '#ff4d6a' : due_soon_count > 0 ? '#ffb300' : '#00e676';
  const visibleItems = expanded ? items : items.slice(0, 4);
  return (
    <div style={{ marginTop: '10px', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${headerColor}33`, background: `${headerColor}06` }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${headerColor}22`, background: `${headerColor}0a`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: headerColor }}>🔧 Lịch bảo dưỡng — {car_model}</span>
        <span style={{ fontSize: '0.7rem', color: '#8899b4', fontFamily: 'JetBrains Mono, monospace' }}>{current_km.toLocaleString()} km</span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.82rem', color: headerColor, marginBottom: '10px', fontWeight: 500 }}>{summary}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {visibleItems.map((item: MaintenanceItem) => {
            const cfg = STATUS_CFG[item.status as keyof typeof STATUS_CFG];
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <span style={{ fontSize: '0.9rem' }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f4ff' }}>{item.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#8899b4', marginTop: '1px' }}>
                    {item.status === 'overdue'
                      ? `Quá hạn ${Math.abs(item.km_remaining).toLocaleString()} km`
                      : `Còn ${item.km_remaining.toLocaleString()} km · đến hạn tại ${item.next_due_km.toLocaleString()} km`}
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '20px', background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
        {items.length > 4 && (
          <button onClick={() => setExpanded(v => !v)} style={{ marginTop: '8px', width: '100%', padding: '7px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8899b4', fontSize: '0.78rem', cursor: 'pointer' }}>
            {expanded ? '▲ Thu gọn' : `▼ Xem thêm ${items.length - 4} hạng mục`}
          </button>
        )}
      </div>
    </div>
  );
}

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
  onRetryTool?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onFeedback,
  showSources,
  onToggleSources,
  onRetryTool,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [hovered, setHovered] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.isError ?? false;
  const isTyping = !isUser && !message.content && !isError && !message.toolCall;
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
        {isUser
          ? <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          : <MarkdownContent text={message.content} />
        }
        {/* Tool call result card */}
        {message.toolCall && message.toolCall.tool === 'find_charging_stations' && (
          <ChargingStationToolCard toolCall={message.toolCall} onRetry={() => onRetryTool?.(message.id)} />
        )}
        {message.toolCall && message.toolCall.tool === 'battery_range' && (
          <BatteryRangeCard toolCall={message.toolCall} />
        )}
        {message.toolCall && message.toolCall.tool === 'maintenance_schedule' && (
          <MaintenanceCard toolCall={message.toolCall} />
        )}
        {message.toolCall && message.toolCall.tool === 'search_nearby_places' && (
          <PlacesCard toolCall={message.toolCall} />
        )}
        {message.toolCall && message.toolCall.tool === 'get_directions' && (
          <DirectionsCard toolCall={message.toolCall} />
        )}
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
