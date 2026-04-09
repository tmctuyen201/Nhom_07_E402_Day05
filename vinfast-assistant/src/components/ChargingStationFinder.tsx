import React, { useState, useCallback } from 'react';

interface Station {
  name: string;
  address: string;
  rating?: number;
  reviews?: number;
  open_now?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  maps_url: string;
  thumbnail?: string;
}

interface ChargingStationFinderProps {
  onClose: () => void;
}

type LocationState = 'idle' | 'requesting' | 'searching' | 'done' | 'error';

export const ChargingStationFinder: React.FC<ChargingStationFinderProps> = ({ onClose }) => {
  const [state, setState] = useState<LocationState>('idle');
  const [stations, setStations] = useState<Station[]>([]);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [source, setSource] = useState<'serpapi' | 'static_fallback' | ''>('');

  const searchStations = useCallback(async (lat: number, lng: number) => {
    setState('searching');
    try {
      const res = await fetch('/api/charging-stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, radius_km: 15 }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setStations(data.stations ?? []);
      setSource(data.source ?? '');
      setState('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      setState('error');
    }
  }, []);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị. Vui lòng dùng Chrome/Firefox.');
      setState('error');
      return;
    }
    setState('requesting');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        searchStations(lat, lng);
      },
      err => {
        const msgs: Record<number, string> = {
          1: 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.',
          2: 'Không thể xác định vị trí. Kiểm tra kết nối mạng.',
          3: 'Hết thời gian chờ. Thử lại.',
        };
        setError(msgs[err.code] ?? 'Lỗi định vị.');
        setState('error');
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }, [searchStations]);

  const mapsSearchUrl = userLocation
    ? `https://www.google.com/maps/search/tr%E1%BA%A1m+s%E1%BA%A1c+VinFast/@${userLocation.lat},${userLocation.lng},13z`
    : 'https://www.google.com/maps/search/trạm+sạc+VinFast';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '20px 16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: '680px',
        background: '#0a0f1a',
        border: '1px solid rgba(0,212,255,0.15)',
        borderRadius: '18px', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'fadeInUp 0.25s ease-out',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid rgba(0,212,255,0.1)',
          background: 'rgba(0,212,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f4ff' }}>
                Tìm trạm sạc VinFast
              </div>
              <div style={{ fontSize: '0.72rem', color: '#8899b4', marginTop: '1px' }}>
                Dùng vị trí của bạn để tìm trạm sạc gần nhất
              </div>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}
            onMouseOver={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(255,77,106,0.15)', color: '#ff4d6a' })}
            onMouseOut={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(255,255,255,0.05)', color: '#8899b4' })}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px' }}>

          {/* Idle / Error state — show CTA */}
          {(state === 'idle' || state === 'error') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))',
                border: '1px solid rgba(0,212,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
              }}>📍</div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f0f4ff', marginBottom: '6px' }}>
                  Cho phép truy cập vị trí
                </div>
                <div style={{ fontSize: '0.82rem', color: '#8899b4', maxWidth: '340px', lineHeight: 1.6 }}>
                  Ứng dụng sẽ dùng tọa độ GPS của bạn để tìm trạm sạc VinFast gần nhất qua SerpAPI.
                  Vị trí không được lưu lại.
                </div>
              </div>

              {state === 'error' && (
                <div style={{
                  padding: '10px 16px', borderRadius: '10px',
                  background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)',
                  color: '#ff8a9e', fontSize: '0.82rem', textAlign: 'center', maxWidth: '400px',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleGetLocation} style={primaryBtnStyle}
                onMouseOver={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'linear-gradient(135deg, #00b8d9, #0099b8)' })}
                onMouseOut={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'linear-gradient(135deg, #00d4ff, #00b8d9)' })}>
                📍 Lấy vị trí của tôi
              </button>

              {/* Manual Google Maps fallback */}
              <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', color: '#8899b4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Hoặc tìm trên Google Maps ↗
              </a>
            </div>
          )}

          {/* Requesting location */}
          {state === 'requesting' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '32px 0' }}>
              <div style={{ fontSize: '2rem', animation: 'spin 1.5s linear infinite' }}>📡</div>
              <div style={{ color: '#8899b4', fontSize: '0.875rem' }}>Đang lấy vị trí GPS...</div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>Vui lòng cho phép truy cập vị trí trong trình duyệt</div>
            </div>
          )}

          {/* Searching */}
          {state === 'searching' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '32px 0' }}>
              <div style={{ fontSize: '2rem', animation: 'spin 1.5s linear infinite' }}>⚡</div>
              <div style={{ color: '#8899b4', fontSize: '0.875rem' }}>Đang tìm trạm sạc gần bạn...</div>
              {userLocation && (
                <div style={{ fontSize: '0.72rem', color: '#4a5568', fontFamily: 'JetBrains Mono, monospace' }}>
                  📍 {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {state === 'done' && (
            <div>
              {/* Location + source badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {userLocation && (
                    <span style={{ fontSize: '0.72rem', color: '#4a5568', fontFamily: 'JetBrains Mono, monospace' }}>
                      📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.68rem', padding: '2px 8px', borderRadius: '20px',
                    background: source === 'serpapi' ? 'rgba(0,230,118,0.1)' : 'rgba(255,179,0,0.1)',
                    border: source === 'serpapi' ? '1px solid rgba(0,230,118,0.25)' : '1px solid rgba(255,179,0,0.25)',
                    color: source === 'serpapi' ? '#00e676' : '#ffb300',
                  }}>
                    {source === 'serpapi' ? '✓ Live SerpAPI' : '⚠ Danh sách tĩnh'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleGetLocation} style={secondaryBtnStyle}
                    onMouseOver={e => Object.assign((e.currentTarget as HTMLElement).style, { borderColor: 'rgba(0,212,255,0.4)', color: '#00d4ff' })}
                    onMouseOut={e => Object.assign((e.currentTarget as HTMLElement).style, { borderColor: 'rgba(255,255,255,0.1)', color: '#8899b4' })}>
                    🔄 Tìm lại
                  </button>
                  <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" style={mapLinkStyle}>
                    🗺 Mở Maps
                  </a>
                </div>
              </div>

              {stations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#8899b4', fontSize: '0.875rem' }}>
                  Không tìm thấy trạm sạc nào gần đây.
                  <br />
                  <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#00d4ff', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
                    Tìm trên Google Maps ↗
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto' }}>
                  {stations.map((s, i) => (
                    <StationCard key={i} station={s} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Station Card ──────────────────────────────────────────────
const StationCard: React.FC<{ station: Station; index: number }> = ({ station, index }) => {
  const isOpen = station.open_now?.toLowerCase().includes('open') || station.open_now?.toLowerCase().includes('mở');

  return (
    <div style={{
      background: '#1a2235',
      border: '1px solid rgba(0,212,255,0.1)',
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
      transition: 'border-color 0.2s',
    }}
      onMouseOver={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.25)'}
      onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.1)'}
    >
      {/* Index badge */}
      <div style={{
        flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px',
        background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff',
      }}>
        {index + 1}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f0f4ff', marginBottom: '3px' }}>
          {station.name}
        </div>
        {station.address && (
          <div style={{ fontSize: '0.78rem', color: '#8899b4', marginBottom: '6px' }}>
            📍 {station.address}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {station.rating && (
            <span style={{ fontSize: '0.72rem', color: '#ffb300' }}>
              ⭐ {station.rating}{station.reviews ? ` (${station.reviews})` : ''}
            </span>
          )}
          {station.open_now && (
            <span style={{
              fontSize: '0.68rem', padding: '2px 7px', borderRadius: '20px',
              background: isOpen ? 'rgba(0,230,118,0.1)' : 'rgba(255,77,106,0.1)',
              border: isOpen ? '1px solid rgba(0,230,118,0.25)' : '1px solid rgba(255,77,106,0.25)',
              color: isOpen ? '#00e676' : '#ff4d6a',
            }}>
              {station.open_now}
            </span>
          )}
          {station.phone && (
            <a href={`tel:${station.phone}`} style={{ fontSize: '0.72rem', color: '#8899b4', textDecoration: 'none' }}>
              📞 {station.phone}
            </a>
          )}
        </div>
      </div>

      {/* Directions button */}
      <a
        href={station.maps_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flexShrink: 0,
          padding: '7px 12px',
          borderRadius: '8px',
          background: 'rgba(0,212,255,0.1)',
          border: '1px solid rgba(0,212,255,0.2)',
          color: '#00d4ff',
          fontSize: '0.75rem',
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}
        onMouseOver={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(0,212,255,0.2)', borderColor: 'rgba(0,212,255,0.4)' })}
        onMouseOut={e => Object.assign((e.currentTarget as HTMLElement).style, { background: 'rgba(0,212,255,0.1)', borderColor: 'rgba(0,212,255,0.2)' })}
      >
        🗺 Chỉ đường
      </a>
    </div>
  );
};

// ── Shared styles ─────────────────────────────────────────────
const closeBtnStyle: React.CSSProperties = {
  width: '34px', height: '34px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#8899b4', fontSize: '1rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '11px 28px', borderRadius: '12px',
  background: 'linear-gradient(135deg, #00d4ff, #00b8d9)',
  border: 'none', color: '#0a0f1a',
  fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '8px',
  transition: 'background 0.2s',
  boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '8px',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
  color: '#8899b4', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
  transition: 'all 0.15s',
};

const mapLinkStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '8px',
  background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
  color: '#00d4ff', fontSize: '0.78rem', fontWeight: 600,
  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
};
