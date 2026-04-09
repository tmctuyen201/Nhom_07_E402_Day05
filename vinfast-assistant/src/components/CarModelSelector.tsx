import React from 'react';

const CAR_MODELS = [
  {
    id: 'VF8',
    name: 'VF8',
    tagline: 'SUV điện thông minh',
    specs: '🔋 460 km | ⚡ 300 kW | 📏 4.750 mm',
    description: 'Xe SUV điện 5+2 chỗ — phù hợp gia đình & doanh nghiệp',
    color: '#00d4ff',
  },
  {
    id: 'VF9',
    name: 'VF9',
    tagline: 'SUV điện hạng sang',
    specs: '🔋 510 km | ⚡ 300 kW | 📏 5.120 mm',
    description: 'Xe SUV điện 7 chỗ cao cấp — không gian rộng rãi',
    color: '#c8102e',
  },
];

interface CarModelSelectorProps {
  selected: string;
  onChange: (model: string) => void;
}

export const CarModelSelector: React.FC<CarModelSelectorProps> = ({ selected, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '4px',
      }}
    >
      {CAR_MODELS.map(model => {
        const isActive = selected === model.id;
        return (
          <button
            key={model.id}
            onClick={() => onChange(model.id)}
            title={model.description}
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${model.color}22 0%, ${model.color}11 100%)`
                : 'transparent',
              border: isActive
                ? `1px solid ${model.color}66`
                : '1px solid transparent',
              borderRadius: '10px',
              padding: '7px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              color: isActive ? model.color : '#8899b4',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.875rem',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseOver={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLButtonElement).style.color = '#f0f4ff';
              }
            }}
            onMouseOut={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
              }
            }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  right: '6px',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: model.color,
                  boxShadow: `0 0 6px ${model.color}`,
                  animation: 'glowPulse 2s ease-in-out infinite',
                }}
              />
            )}

            {/* Car SVG icon */}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/>
              <path d="M9 17h6"/>
              <path d="M7 21h10"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="17" cy="18" r="2"/>
            </svg>

            <span style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
              {model.name}
            </span>

            {/* Tooltip on hover (description) */}
            {isActive && (
              <span
                style={{
                  fontSize: '0.7rem',
                  color: model.color,
                  opacity: 0.8,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  letterSpacing: 0,
                }}
              >
                {model.tagline}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
