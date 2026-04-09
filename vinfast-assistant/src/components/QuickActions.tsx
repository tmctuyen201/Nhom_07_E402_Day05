import React from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  query: string;
  color: string;
  category?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'warning-lights',
    label: 'Đèn cảnh báo',
    icon: '⚠️',
    query: 'Cho tôi biết về các đèn cảnh báo trên xe VinFast và ý nghĩa của chúng',
    color: '#ffb300',
    category: 'safety',
  },
  {
    id: 'charging',
    label: 'Sạc pin',
    icon: '🔋',
    query: 'Hướng dẫn sạc pin và mẹo tiết kiệm điện cho VinFast',
    color: '#00e676',
    category: 'charging',
  },
  {
    id: 'adas',
    label: 'ADAS',
    icon: '🤖',
    query: 'Các tính năng ADAS trên VinFast VF8/VF9 hoạt động như thế nào?',
    color: '#00d4ff',
    category: 'adas',
  },
  {
    id: 'safety',
    label: 'An toàn',
    icon: '🛡️',
    query: 'Các tính năng an toàn trên VinFast VF8/VF9',
    color: '#c8102e',
    category: 'safety',
  },
  {
    id: 'maintenance',
    label: 'Bảo dưỡng',
    icon: '🔧',
    query: 'Lịch bảo dưỡng định kỳ và những lưu ý khi bảo dưỡng VinFast',
    color: '#a78bfa',
    category: 'maintenance',
  },
];

// Warning light icons grid for modal
const WARNING_LIGHTS = [
  { icon: '🛑', name: 'Phanh tay', meaning: 'Kéo phanh tay chưa hoàn toàn' },
  { icon: '🔴', name: 'Cảnh báo chung', meaning: 'Có sự cố — kiểm tra ngay' },
  { icon: '🟡', name: 'Engine', meaning: 'Lỗi động cơ — mang đi kiểm tra' },
  { icon: '🟠', name: 'Pin', meaning: 'Hệ thống sạc/pin gặp vấn đề' },
  { icon: '💧', name: 'Nước làm mát', meaning: 'Mức nước làm mát thấp' },
  { icon: '🛞', name: 'Áp suất lốp', meaning: 'Lốp non hoặc bơm không đều' },
  { icon: '🔋', name: 'ắc quy', meaning: 'ắc quy yếu hoặc lỗi sạc' },
  { icon: '🌡️', name: 'Nhiệt độ', meaning: 'Động cơ quá nóng — dừng xe ngay' },
];

interface QuickActionsProps {
  onAction: (action: string) => void;
  currentCategory?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, currentCategory }) => {
  const [activeModal, setActiveModal] = React.useState<string | null>(null);

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 20px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          MsOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {QUICK_ACTIONS.map(action => {
          const isHighlighted = currentCategory === action.category;
          return (
            <button
              key={action.id}
              onClick={() => {
                if (action.id === 'warning-lights') {
                  setActiveModal(activeModal === action.id ? null : action.id);
                } else {
                  onAction(action.query);
                }
              }}
              style={{
                background: isHighlighted
                  ? `linear-gradient(135deg, ${action.color}22, ${action.color}11)`
                  : 'rgba(255,255,255,0.03)',
                border: isHighlighted
                  ? `1px solid ${action.color}55`
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isHighlighted ? action.color : '#8899b4',
                fontSize: '0.8125rem',
                fontWeight: isHighlighted ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: isHighlighted ? `0 0 12px ${action.color}22` : 'none',
              }}
              onMouseOver={e => {
                if (!isHighlighted) {
                  (e.currentTarget as HTMLButtonElement).style.background = `${action.color}11`;
                  (e.currentTarget as HTMLButtonElement).style.color = action.color;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${action.color}33`;
                }
              }}
              onMouseOut={e => {
                if (!isHighlighted) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                }
              }}
            >
              <span style={{ fontSize: '1rem' }}>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Warning lights modal */}
      {activeModal === 'warning-lights' && (
        <div
          style={{
            margin: '0 20px 12px',
            padding: '16px',
            background: 'rgba(255,179,0,0.05)',
            border: '1px solid rgba(255,179,0,0.2)',
            borderRadius: '14px',
            animation: 'slideDown 0.25s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffb300' }}>
              ⚠️ Đèn cảnh báo phổ biến trên VinFast
            </span>
            <button
              onClick={() => setActiveModal(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8899b4',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '2px 6px',
              }}
            >
              ✕ Đóng
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '8px',
            }}
          >
            {WARNING_LIGHTS.map(light => (
              <div
                key={light.name}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{light.icon}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f4ff' }}>
                    {light.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#8899b4', marginTop: '2px' }}>
                    {light.meaning}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setActiveModal(null);
              onAction(QUICK_ACTIONS[0].query);
            }}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '9px',
              background: 'rgba(255,179,0,0.12)',
              border: '1px solid rgba(255,179,0,0.3)',
              borderRadius: '10px',
              color: '#ffb300',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,179,0,0.22)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,179,0,0.12)';
            }}
          >
            Hỏi chi tiết về tất cả đèn cảnh báo
          </button>
        </div>
      )}
    </>
  );
};
