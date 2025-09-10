import React, { useState, useEffect, useCallback } from 'react';
import { Image } from '../../../types';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';
import ImageCard from '../../ImageCard/ImageCard';
import Lightbox from '../../Lightbox/Lightbox';

const GridView: React.FC = () => {
  const { searchTerm, isLoading, setIsLoading, t } = useApp();
  const [images, setImages] = useState<Image[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    // Reset and load images when search term changes
    setImages([]);
    setCurrentPage(1);
    setHasMore(true);
    loadImages(1, true);
  }, [searchTerm]);

  const loadImages = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ApiService.getImages({
        term: searchTerm,
        page,
        limit: ITEMS_PER_PAGE,
      });

      if (reset) {
        setImages(response.data);
      } else {
        setImages(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.hasMore || false);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading images:', err);
      setError(t('error.loadImages'));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, setIsLoading, t]);

  const loadMoreImages = useCallback(() => {
    if (!isLoading && hasMore) {
      loadImages(currentPage + 1, false);
    }
  }, [currentPage, hasMore, isLoading, loadImages]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMoreImages();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreImages]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;

    let newIndex = selectedImageIndex;
    if (direction === 'prev') {
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1;
    } else {
      newIndex = selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0;
    }
    setSelectedImageIndex(newIndex);
  };

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i>
        <h3>{error}</h3>
        <button onClick={() => loadImages(1, true)} className="retry-btn">
          {t('button.retry')}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="gallery-grid">
        {images.map((image, index) => (
          <ImageCard
            key={`${image.path}-${index}`}
            image={image}
            onClick={() => handleImageClick(index)}
          />
        ))}
        
        {isLoading && (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            <span>{t('loading.images')}</span>
          </div>
        )}
        
        {!isLoading && images.length === 0 && (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>{t('error.noResults')}</h3>
            <p>{t('error.noResults.description')}</p>
          </div>
        )}
      </div>

      {selectedImageIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={selectedImageIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </>
  );
};

export default GridView;
