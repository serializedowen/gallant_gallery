import React, { useEffect, useCallback } from 'react';
import { Image } from '../../types';
import { useApp } from '../../contexts/AppContext';
import ApiService from '../../services/api';

interface LightboxProps {
  images: Image[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const { t } = useApp();
  const currentImage = images[currentIndex];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        onNavigate('prev');
        break;
      case 'ArrowRight':
        onNavigate('next');
        break;
      default:
        break;
    }
  }, [onClose, onNavigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!currentImage) return null;

  return (
    <div className="lightbox">
      <div className="lightbox-overlay" onClick={onClose}></div>
      
      <div className="lightbox-container">
        <button 
          className="lightbox-close" 
          onClick={onClose}
          title={t('button.close')}
        >
          <i className="fas fa-times"></i>
        </button>
        
        <button 
          className="lightbox-nav lightbox-prev" 
          onClick={() => onNavigate('prev')}
          title={t('button.previous')}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        <button 
          className="lightbox-nav lightbox-next" 
          onClick={() => onNavigate('next')}
          title={t('button.next')}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
        
        <div className="lightbox-content">
          <img 
            className="lightbox-image" 
            src={ApiService.getImageUrl(currentImage.path)}
            alt={currentImage.name}
          />
          
          <div className="lightbox-info">
            <div className="lightbox-metadata">
              <h3 className="image-title">{currentImage.name}</h3>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">{t('lightbox.size')}:</span>
                  <span className="metadata-value">{formatFileSize(currentImage.size)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">{t('lightbox.dimensions')}:</span>
                  <span className="metadata-value">
                    {currentImage.dimensions.width} × {currentImage.dimensions.height}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">{t('lightbox.format')}:</span>
                  <span className="metadata-value">{currentImage.format}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">{t('lightbox.directory')}:</span>
                  <span className="metadata-value">{currentImage.directory}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
