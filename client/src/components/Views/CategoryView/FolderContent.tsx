import React, { useState, useEffect, useCallback } from 'react';
import { Image } from '../../../types/api-definitions';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';
import ImageCard from '../../ImageCard/ImageCard';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';

interface FolderContentProps {
  selectedFolder: {
    name: string;
    directory: string;
    categoryName?: string;
  } | null;
  onImageClick: (index: number, images: Image[]) => void;
}

const FolderContent: React.FC<FolderContentProps> = ({
  selectedFolder,
  onImageClick,
}) => {
  const { t, isLoading, setIsLoading } = useApp();
  const [images, setImages] = useState<Image[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  const loadImages = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      if (!selectedFolder) return;

      try {
        setIsLoading(true);
        setError(null);

        const searchQuery = `dir="${selectedFolder.directory}"`;

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
    [selectedFolder, setIsLoading, t]
  );

  useEffect(() => {
    if (selectedFolder) {
      setImages([]);
      setCurrentPage(1);
      setHasMore(true);
      loadImages(1, true);
    } else {
      setImages([]);
    }
  }, [selectedFolder, loadImages]);

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
    onImageClick(index, images);
  };

  if (!selectedFolder) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: '100%', overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          <FolderIcon sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant='h5' gutterBottom>
            {t('folder.select')}
          </Typography>
          <Typography variant='body1'>
            {t('folder.select.description')}
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
        <Alert
          severity="error"
          action={
            <Button onClick={() => loadImages(1, true)}>
              {t('button.retry')}
            </Button>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant='h4' component='h2' gutterBottom>
          {selectedFolder.name}
        </Typography>
        {selectedFolder.categoryName && (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            {t('folder.category')}: {selectedFolder.categoryName}
          </Typography>
        )}
        <Typography variant='body2' color='text.secondary'>
          {images.length} {t('stats.images')}
        </Typography>
      </Box>

      {images.length === 0 && !isLoading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100% - 100px)',
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          <FolderIcon sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant='h6'>{t('folder.noImages')}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {images.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`${image.path}-${index}`}>
              <ImageCard image={image} onClick={() => handleImageClick(index)} />
            </Grid>
          ))}
        </Grid>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Paper>
  );
};

export default FolderContent;
