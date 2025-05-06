import React, { useEffect, useRef } from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';

// Popup Card component props interface
export interface PopupCardProps {
  title: string;
  content: string;
  position: { top: number; left: number };
  onClose: () => void;
}

const PopupCard: React.FC<PopupCardProps> = ({ title, content, position, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Close the popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={cardRef}
      className="popup-card"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
        backgroundColor: 'var(--ring-content-background-color)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        borderRadius: 'var(--ring-border-radius)',
        border: '1px solid var(--ring-line-color)',
        padding: 'var(--ring-unit)',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'calc(var(--ring-unit) / 2)' }}>
        <h3 style={{ margin: 0, color: 'var(--ring-main-color)' }}>{title}</h3>
        <Button onClick={onClose}>✕</Button>
      </div>
      <div style={{ whiteSpace: 'pre-line', color: 'var(--ring-secondary-color)' }}>{content}</div>
    </div>
  );
};

export default PopupCard;
