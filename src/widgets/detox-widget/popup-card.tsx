import React, { useEffect, useRef } from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import { getScoreColor } from './toxic-score';

// Popup Card component props interface
export interface PopupCardProps {
  title: string;
  content: string;
  position: { top: number; left: number };
  onClose: () => void;
  url?: string; // Optional URL for the title
  toxicScore?: number; // Optional toxic score
  emotionalTemperature?: number; // Optional emotional temperature (1: Rising, 0: Neutral, -1: Calming down)
  reporterToxicScore?: string; // Optional reporter's toxic score
  commentersToxicScore?: string; // Optional commenters' toxic score
}

const PopupCard: React.FC<PopupCardProps> = ({ title, content, position, onClose, url, toxicScore, emotionalTemperature, reporterToxicScore, commentersToxicScore }) => {
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
        width: 'fit-content',
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'calc(var(--ring-unit) / 2)', gap: 'var(--ring-unit)' }}>
        <h3 style={{ margin: 0, color: 'var(--ring-main-color)' }}>
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ring-link-color)', textDecoration: 'none' }}>
              {title}
            </a>
          ) : (
            title
          )}
        </h3>
        <Button
          onClick={onClose}
          style={{
            minWidth: 'auto',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >✕</Button>
      </div>
      {toxicScore !== undefined && (
        <div style={{
          marginBottom: 'var(--ring-unit)',
          fontWeight: 'bold',
          color: getScoreColor(toxicScore)
        }}
        >
          Toxic Score: {toxicScore}
        </div>
      )}
      {emotionalTemperature !== undefined && (
        <div style={{
          marginBottom: 'var(--ring-unit)',
          fontWeight: 'bold',
          color: emotionalTemperature === 1 ? '#e5493a' : emotionalTemperature === -1 ? '#59a869' : '#f0ad4e'
        }}
        >
          Emotional temperature: {emotionalTemperature === 1 ? '↑ Rising' : emotionalTemperature === -1 ? '↓ Calming' : ' → Stays the same'}
        </div>
      )}
      {reporterToxicScore && (
        <div style={{
          marginBottom: 'var(--ring-unit)',
          fontWeight: 'bold',
          color: 'var(--ring-text-color)',
          display: 'flex',
          alignItems: 'center'
        }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            style={{
              marginRight: '4px',
              fill: 'currentColor'
            }}
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          Reporter: {reporterToxicScore}
        </div>
      )}
      {commentersToxicScore && (
        <div style={{
          marginBottom: 'var(--ring-unit)',
          fontWeight: 'bold',
          color: 'var(--ring-text-color)',
          display: 'flex',
          alignItems: 'center'
        }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            style={{
              marginRight: '4px',
              fill: 'currentColor'
            }}
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          Answers: {commentersToxicScore}
        </div>
      )}
      <div style={{ whiteSpace: 'pre-line', color: 'var(--ring-text-color)' }}>{content}</div>
    </div>
  );
};

export default PopupCard;
