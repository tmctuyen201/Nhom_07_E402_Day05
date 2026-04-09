import React, { useState, useMemo } from 'react';

interface MaintenanceTrackerProps {
  onClose: () => void;
  onAskAI: (query: string) => void;
  carModel: string;
}

interface MaintenanceItem {
  id: string;
  name: string;
  intervalKm: number;
}

const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  { id: 'tong-quat',       name: 'Kiểm tra tổng quát',            intervalKm: 15000 },
  { id: 'dau-phanh',       name: 'Thay dầu phanh',                intervalKm: 30000 },
  { id: 'xoay-lop',        name: 'Xoay lốp',                      intervalKm: 10000 },
  { id: 'thay-lop',        name: 'Thay lốp (gai < 1.6mm)',        intervalKm: 50000 },
  { id: 'nuoc-lam-mat-pin',name: 'Thay nước làm mát pin HV',      intervalKm: 60000 },
  { id: 'nuoc-lam-mat-dm', name: 'Thay nước làm mát động cơ',     intervalKm: 60000 },
  { id: 'ma-phanh',        name: 'Kiểm tra má phanh',             intervalKm: 20000 },
  { id: 'acquy-12v',       name: 'Thay ắc quy 12V',               intervalKm: 50000 },
  { id: 'adas',            name: 'Kiểm tra hệ thống ADAS',        intervalKm: 15000 },
  { id: 've-sinh-dong-co', name: 'Vệ sinh khoang động cơ',        intervalKm: 30000 },
  { id: 'dien-cao-ap',     name: 'Kiểm tra hệ thống điện cao áp', intervalKm: 30000 },
  { id: 'loc-cabin',       name: 'Thay bộ lọc cabin',             intervalKm: 20000 },
];

type StatusType = 'overdue' | 'due-soon' | 'upcoming' | 'ok';

function getStatus(currentKm: number, nextDueKm: number): StatusType {
  const diff = nextDueKm - currentKm;
  if (diff <= 0)    return 'overdue';
  if (diff <= 2000) return 'due-soon';
  if (diff <= 5000) return 'upcoming';
  return 'ok';
}

const STATUS_CONFIG: Record<StatusType, { icon: string; label: string; color: string; bg: string; border: string }> = {
  overdue:  { icon: '🔴', label: 'Quá hạn',   color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',  border: 'rgba(255,77,106,0.3)'  },
  'due-soon':{ icon: '⚠️', label: 'Sắp đến',  color: '#ffb300', bg: 'rgba(255,179,0,0.12)',   border: 'rgba(255,179,0,0.3)'   },
  upcoming: { icon: '⏳', label: 'Sắp tới',   color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.2)'   },
  ok:       { icon: '✅', label: 'Tốt',        color: '#00e676', bg: 'rgba(0,230,118,0.08)',   border: 'rgba(0,230,118,0.2)'   },
};

export const MaintenanceTracker: React.FC<MaintenanceTrackerProps> = ({ onClose, onAskAI, carModel }) => {
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');

  const items = useMemo(() => {
    return MAINTENANCE_ITEMS.map(item => {
      const cycles = currentKm > 0 ? Math.floor(currentKm / item.intervalKm) : 0;
      const nextDueKm = (cycles + 1) * item.intervalKm;
      const status = getStatus(currentKm, nextDueKm);
      return { ...item, nextDueKm, status };
    });
  }, [currentKm]);

  const okCount = items.filter(i => i.status === 'ok').length;
  const healthPct = Math.round((okCount / items.length) * 100);

  const healthColor =
    healthPct >= 80 ? '#00e676' :
    healthPct >= 50 ? '#ffb300' : '#ff4d6a';

  const handleKmChange = (val: string) => {
    setInputVal(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0) setCurrentKm(n);
    else if (val === '') setCurrentKm(0);
  };

  const handleAskAI = (item: typeof items[0]) => {
    const query = `Hướng dẫn chi tiết về ${item.name} cho xe VinFast ${carModel}. Xe đang ở ${currentKm} km.`;
    onAskAI(query);
    onClose();
  };

  // Sort: overdue first, then due-soon, upcoming, ok
  const ORDER: StatusType[] = ['overdue', 'due-soon', 'upcoming', 'ok'];
  const sorted = [...items].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '20px 16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#0a0f1a',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'fadeInUp 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(0,212,255,0.1)',
            background: 'rgba(0,212,255,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔧</span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f4ff' }}>
                Maintenance Tracker
              </div>
              <div style={{ fontSize: '0.72rem', color: '#8899b4', marginTop: '1px' }}>
                VinFast {carModel} · Lịch bảo dưỡng chính hãng
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#8899b4',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,106,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ff4d6a';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
            }}
          >
            ✕
          </button>
        </div>

        {/* Odometer input + health bar */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.875rem', color: '#8899b4', whiteSpace: 'nowrap' }}>
              Số km hiện tại:
            </label>
            <input
              type="number"
              min={0}
              value={inputVal}
              onChange={e => handleKmChange(e.target.value)}
              placeholder="Nhập số km (vd: 25000)"
              style={{
                flex: 1,
                minWidth: '180px',
                background: '#1a2235',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '10px',
                padding: '9px 14px',
                color: '#f0f4ff',
                fontSize: '0.9rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            {currentKm > 0 && (
              <span style={{ fontSize: '0.8rem', color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                {currentKm.toLocaleString()} km
              </span>
            )}
          </div>

          {/* Health bar */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#8899b4' }}>Tình trạng tổng thể</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: healthColor }}>
                {healthPct}% tốt ({okCount}/{items.length} hạng mục)
              </span>
            </div>
            <div
              style={{
                height: '6px',
                borderRadius: '99px',
                background: 'rgba(255,255,255,0.07)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${healthPct}%`,
                  borderRadius: '99px',
                  background: `linear-gradient(90deg, ${healthColor}99, ${healthColor})`,
                  transition: 'width 0.4s ease',
                  boxShadow: `0 0 8px ${healthColor}66`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Maintenance grid */}
        <div
          style={{
            padding: '16px 22px 22px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '10px',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          {sorted.map(item => {
            const cfg = STATUS_CONFIG[item.status];
            const diff = item.nextDueKm - currentKm;
            return (
              <div
                key={item.id}
                style={{
                  background: '#1a2235',
                  border: `1px solid ${cfg.border}`,
                  borderRadius: '12px',
                  padding: '13px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Top row: name + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0f4ff', lineHeight: 1.3 }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      color: cfg.color,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                {/* Km info */}
                <div style={{ fontSize: '0.75rem', color: '#8899b4' }}>
                  {item.status === 'overdue' ? (
                    <span style={{ color: '#ff4d6a' }}>
                      Đến hạn tại: {item.nextDueKm.toLocaleString()} km
                      {currentKm > 0 && ` (quá ${Math.abs(diff).toLocaleString()} km)`}
                    </span>
                  ) : (
                    <>
                      Đến hạn tại:{' '}
                      <span style={{ color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}>
                        {item.nextDueKm.toLocaleString()} km
                      </span>
                      {currentKm > 0 && (
                        <span style={{ color: '#8899b4' }}> · còn {diff.toLocaleString()} km</span>
                      )}
                    </>
                  )}
                </div>

                {/* Interval info */}
                <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>
                  Chu kỳ: mỗi {item.intervalKm.toLocaleString()} km
                </div>

                {/* Ask AI button */}
                <button
                  onClick={() => handleAskAI(item)}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '2px',
                    padding: '5px 11px',
                    borderRadius: '8px',
                    background: 'rgba(0,212,255,0.08)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    color: '#00d4ff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.18)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.45)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.2)';
                  }}
                >
                  Hỏi AI →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
