import React, { useState } from 'react';
import { saveUserProfile, type UserProfile } from '../lib/memory/userProfile';

interface Props {
  initial: UserProfile | null;
  onSave: (p: UserProfile) => void;
  onClose: () => void;
}

const CAR_VARIANTS = [
  'VF7 Eco', 'VF7 Plus',
  'VF8 Eco', 'VF8 Plus',
  'VF9 Eco', 'VF9 Plus',
];

export const UserProfileSetup: React.FC<Props> = ({ initial, onSave, onClose }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [carVariant, setCarVariant] = useState(initial?.carVariant ?? '');
  const [currentKm, setCurrentKm] = useState(initial?.currentKm?.toString() ?? '');

  const handleSave = () => {
    const profile = saveUserProfile({
      name: name.trim(),
      carVariant,
      currentKm: currentKm ? parseInt(currentKm, 10) : null,
    });
    onSave(profile);
    onClose();
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 400,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    animation: 'fadeIn 0.2s ease-out',
  };

  const card: React.CSSProperties = {
    width: '100%', maxWidth: '420px',
    background: '#111827', border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '18px', padding: '28px 24px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'fadeInUp 0.25s ease-out',
  };

  const label: React.CSSProperties = {
    fontSize: '0.78rem', color: '#8899b4', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block',
  };

  const input: React.CSSProperties = {
    width: '100%', background: '#1a2235', border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: '10px', padding: '10px 14px', color: '#f0f4ff',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };

  const select: React.CSSProperties = { ...input, cursor: 'pointer' };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff' }}>👤 Hồ sơ của bạn</div>
            <div style={{ fontSize: '0.75rem', color: '#8899b4', marginTop: '2px' }}>
              Bot sẽ nhớ và chào bạn bằng tên
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8899b4', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={label}>Tên của bạn</label>
            <input
              style={input} type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nhập tên (vd: Minh, Lan...)"
            />
          </div>

          <div>
            <label style={label}>Dòng xe đang sử dụng</label>
            <select style={select} value={carVariant} onChange={e => setCarVariant(e.target.value)}>
              <option value="">-- Chọn dòng xe --</option>
              {CAR_VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label style={label}>Số km hiện tại (tuỳ chọn)</label>
            <input
              style={input} type="number" min={0} value={currentKm}
              onChange={e => setCurrentKm(e.target.value)}
              placeholder="vd: 25000"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: '#8899b4', cursor: 'pointer', fontSize: '0.875rem',
          }}>Bỏ qua</button>
          <button onClick={handleSave} style={{
            flex: 2, padding: '10px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00d4ff, #00b8d9)',
            border: 'none', color: '#0a0f1a', fontWeight: 700,
            cursor: 'pointer', fontSize: '0.875rem',
          }}>Lưu hồ sơ</button>
        </div>
      </div>
    </div>
  );
};
