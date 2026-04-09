import React, { useState, useRef, useCallback } from 'react';

interface ChatInputProps {
  onSend: (query: string, imageData?: string) => void;
  onImageSelect: (dataUrl: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const MAX_CHARS = 500;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onImageSelect,
  disabled = false,
  isLoading = false,
}) => {
  const [value, setValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = value.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSend = value.trim().length > 0 && !isOverLimit && !disabled && !isLoading;

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`; // ~4 lines max
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    autoResize();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
    setImagePreview(null);
    setShowImagePreview(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleClear = () => {
    setValue('');
    setImagePreview(null);
    setShowImagePreview(false);
    textareaRef.current?.focus();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setShowImagePreview(true);
      onImageSelect(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setShowImagePreview(false);
  };

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px 20px',
    background: 'linear-gradient(180deg, rgba(10,15,26,0) 0%, rgba(10,15,26,0.95) 20%)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    position: 'relative',
    zIndex: 10,
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    background: '#0f1623',
    border: `1px solid ${isOverLimit ? '#ff4d6a' : 'rgba(0,212,255,0.2)'}`,
    borderRadius: '16px',
    padding: '10px 14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: isOverLimit
      ? '0 0 0 3px rgba(255,77,106,0.15)'
      : '0 2px 12px rgba(0,0,0,0.3)',
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#f0f4ff',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    resize: 'none',
    minHeight: '24px',
    maxHeight: '120px',
    overflowY: 'auto',
    padding: '2px 0',
  };

  const iconBtnStyle = (hoverColor: string): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '8px',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    color: disabled || isLoading ? '#4a5568' : '#8899b4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    opacity: disabled || isLoading ? 0.5 : 1,
  });

  const sendBtnStyle: React.CSSProperties = {
    background: canSend
      ? 'linear-gradient(135deg, #c8102e 0%, #a00d25 100%)'
      : 'rgba(255,255,255,0.05)',
    border: canSend
      ? '1px solid rgba(200,16,46,0.6)'
      : '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    padding: '8px 14px',
    cursor: canSend ? 'pointer' : 'not-allowed',
    color: canSend ? '#ffffff' : '#4a5568',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    boxShadow: canSend ? '0 2px 12px rgba(200,16,46,0.35)' : 'none',
    minWidth: '72px',
    justifyContent: 'center',
  };

  const imageThumbStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  };

  const thumbImgStyle: React.CSSProperties = {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    objectFit: 'cover',
    border: '1px solid rgba(0,212,255,0.3)',
  };

  return (
    <div style={wrapperStyle}>
      {/* Image preview row */}
      {showImagePreview && imagePreview && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div style={imageThumbStyle}>
            <img src={imagePreview} alt="Uploaded" style={thumbImgStyle} />
            <button
              onClick={handleRemoveImage}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#c8102e',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              title="Xóa ảnh"
            >
              ✕
            </button>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#8899b4' }}>
            Ảnh đã đính kèm — nhấn gửi để phân tích
          </span>
        </div>
      )}

      {/* Main input row */}
      <div
        style={inputRowStyle}
        onFocus={() => {
          (document.activeElement as HTMLElement)?.closest('[style*="border-radius: 16px"]');
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Image upload button */}
        <button
          style={iconBtnStyle('#00d4ff')}
          onClick={() => !disabled && !isLoading && fileInputRef.current?.click()}
          title="Đính kèm ảnh"
          disabled={disabled || isLoading}
          onMouseOver={e => {
            if (!disabled && !isLoading) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.12)';
              (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.3)';
            }
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLButtonElement).style.color = '#8899b4';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          {/* Camera/Image icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi về xe của bạn... (VD: Cách sạc pin VF8?)"
          disabled={disabled || isLoading}
          rows={1}
          style={{
            ...textareaStyle,
            cursor: disabled || isLoading ? 'not-allowed' : 'text',
          }}
          aria-label="Nhập câu hỏi của bạn"
        />

        {/* Clear button */}
        {value.length > 0 && (
          <button
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#4a5568',
              fontSize: '0.875rem',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onClick={handleClear}
            title="Xóa"
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8899b4'; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4a5568'; }}
          >
            ✕
          </button>
        )}

        {/* Send button */}
        <button
          style={sendBtnStyle}
          onClick={handleSend}
          disabled={!canSend}
          title="Gửi tin nhắn (Enter)"
          onMouseOver={e => {
            if (canSend) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(200,16,46,0.5)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = canSend ? '0 2px 12px rgba(200,16,46,0.35)' : 'none';
            (e.currentTarget as HTMLButtonElement).style.transform = 'none';
          }}
        >
          {isLoading ? (
            <>
              <svg
                style={{ animation: 'spin 0.8s linear infinite' }}
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Đang gửi
            </>
          ) : (
            <>
              Gửi
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Character counter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 4px',
          fontSize: '0.72rem',
        }}
      >
        <span style={{ color: isOverLimit ? '#ff4d6a' : '#4a5568' }}>
          {isOverLimit
            ? `${charCount}/${MAX_CHARS} — Vượt giới hạn`
            : `${charCount}/${MAX_CHARS}`}
        </span>
        <span style={{ color: '#4a5568' }}>Enter để gửi · Shift+Enter để xuống dòng</span>
      </div>
    </div>
  );
};
