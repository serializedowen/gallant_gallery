import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Image } from '../../../types/api-definitions';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';
import ImageCard from '../../ImageCard/ImageCard';
import Lightbox from '../../Lightbox/Lightbox';
import {
  Grid,
  CircularProgress,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';

const GridView: React.FC = () => {
  const { folderName } = useParams<{ folderName?: string }>();
  const { searchTerm, isLoading, setIsLoading, t, selectedPath } = useApp();
  const [images, setImages] = useState<Image[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  const [folderData, setFolderData] = useState<any>(null);

  const ITEMS_PER_PAGE = 20;

  // Load folder data when folderName is provided
  useEffect(() => {
    if (folderName && !selectedPath) {
      // Try to find the folder data to get the correct directory path
      const loadFolderData = async () => {
        try {
          const response = await ApiService.getFolders();
          const folder = response.folders.find(f => f.displayName === decodeURIComponent(folderName));
          if (folder) {
            setFolderData(folder);
          }
        } catch (err) {
          console.error('Error loading folder data:', err);
        }
      };
      loadFolderData();
    }
  }, [folderName, selectedPath]);

  const loadImages = useCallback(
    async (page: number = 1, reset: boolean = false) => {

      try {
        setIsLoading(true);
        setError(null);

        // Build search parameters
        let searchQuery = searchTerm;
        
        // If folderName is provided from URL, get the folder's directory path
        if (folderName) {
          // If we have a selected path from context, use it
          if (selectedPath) {
            searchQuery = `dir="${selectedPath}"` + (searchTerm ? `&keyword="${searchTerm}"` : '');
          } else if (folderData) {
            // Use the folder's directory path
            searchQuery = `dir="${folderData.directory}"` + (searchTerm ? `&keyword="${searchTerm}"` : '');
          } else {
            // If no selectedPath or folderData, use the folderName as a keyword search
            searchQuery = `keyword="${decodeURIComponent(folderName)}"` + (searchTerm ? `&keyword="${searchTerm}"` : '');
          }
        }

        const response = await ApiService.getImages({
          search: searchQuery,
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });

        if (reset) {
          setImages(response.images);
        } else {
          setImages((prev) => [...prev, ...response.images]);
        }

        setHasMore(response.hasMore || false);
        setCurrentPage(page);
      } catch (err) {
        console.error('Error loading images:', err);
        setError(t('error.loadImages'));
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, folderName, selectedPath, folderData, setIsLoading, t]
  );

  useEffect(() => {
    setImages([]);
    setCurrentPage(1);
    setHasMore(true);
    loadImages(1, true);
  }, [searchTerm, folderData, loadImages]);

  const loadMoreImages = useCallback(() => {
    if (!isLoading && hasMore) {
      loadImages(currentPage + 1, false);
    }
  }, [currentPage, hasMore, isLoading, loadImages]);

  useEffect(() => {

    
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
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
    console.log('first')
    setSelectedImageIndex(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;

    let newIndex = selectedImageIndex;
    if (direction === 'prev') {
      newIndex =
        selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1;
    } else {
      newIndex =
        selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0;
    }
    setSelectedImageIndex(newIndex);
  };

  if (error) {
    return (
      <Alert severity="error" action={
        <Button onClick={() => loadImages(1, true)}>
          {t('button.retry')}
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {images.map((image, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`${image.path}-${index}`}>
            <ImageCard image={image} onClick={() => handleImageClick(index)} />
          </Grid>
        ))}
      </Grid>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && images.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6">{t('error.noResults')}</Typography>
          <Typography variant="body1">
            {t('error.noResults.description')}
          </Typography>
        </Box>
      )}

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
