import React from 'react';
import { Image } from '../../types';
import ApiService from '../../services/api';

interface ImageCardProps {
  image: Image;
  onClick: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onClick }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="image-card" onClick={onClick}>
      <div className="image-thumbnail">
        <img
          src={ApiService.getThumbnailUrl(image.thumbnailPath)}
          alt={image.name}
          loading="lazy"
        />
      </div>
      
      <div className="image-info">
        <h4 className="image-name" title={image.name}>
          {image.name}
        </h4>
        <div className="image-meta">
          <span className="image-size">
            {formatFileSize(image.size)}
          </span>
          <span className="image-dimensions">
            {image.dimensions.width} × {image.dimensions.height}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
