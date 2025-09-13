import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, PaginationQuery } from '../../../types/api-definitions';
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
  IconButton,
  Breadcrumbs,
  Link,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import SortIcon from '@mui/icons-material/Sort';

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
  const navigate = useNavigate();
  const [images, setImages] = useState<Image[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<PaginationQuery['sortBy']>('name_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [totalCount, setTotalCount] = useState<number>(0);


  const ITEMS_PER_PAGE = 10;

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
          sortBy: sortBy,
          sortOrder: sortOrder,
        });

        if (reset) {
          setImages(response.images);
        } else {
          setImages((prev) => [...prev, ...response.images]);
        }

        setTotalCount(response.totalCount || 0);
        setHasMore(response.hasMore || false);
        setCurrentPage(page);
      } catch (err) {
        console.error('Error loading images:', err);
        setError(t('error.loadImages'));
      } finally {
        setIsLoading(false);
      }
    },
    [selectedFolder, setIsLoading, t, sortBy, sortOrder]
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

  const handleBackToCategory = () => {
    if (selectedFolder?.categoryName) {
      navigate(`/category/${encodeURIComponent(selectedFolder.categoryName)}`);
    } else {
      navigate('/categories');
    }
  };

  const handleSortChange = (newSortBy: PaginationQuery['sortBy'], newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    // Reset pagination and reload images with new sort
    setImages([]);
    setCurrentPage(1);
    setHasMore(true);
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
          severity='error'
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
      {/* Navigation Breadcrumbs */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={handleBackToCategory}
          size='small'
          sx={{
            mr: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Breadcrumbs aria-label='breadcrumb'>
          <Link
            component='button'
            variant='body2'
            onClick={() => navigate('/categories')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
            {t('nav.categories')}
          </Link>

          {selectedFolder?.categoryName && (
            <Link
              component='button'
              variant='body2'
              onClick={handleBackToCategory}
              sx={{
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {selectedFolder.categoryName}
            </Link>
          )}

          <Typography variant='body2' color='text.primary'>
            {selectedFolder.name}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Sort Controls */}
      {/* <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => handleSortChange(e.target.value as any, sortOrder)}
          >
            <MenuItem value="path">Path</MenuItem>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="name_number">Name (Number)</MenuItem>
            <MenuItem value="directory">Directory</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortOrder}
            label="Order"
            onChange={(e) => handleSortChange(sortBy, e.target.value as 'asc' | 'desc')}
          >
            <MenuItem value="asc">Asc</MenuItem>
            <MenuItem value="desc">Desc</MenuItem>
          </Select>
        </FormControl>
      </Box> */}

      <Box sx={{ mb: 2 }}>
        <Typography variant='h4' component='h2' gutterBottom>
          {selectedFolder.name}
        </Typography>
        {selectedFolder.categoryName && (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            {selectedFolder.categoryName}
          </Typography>
        )}
        <Typography variant='body2' color='text.secondary'>
          {totalCount} {t('stats.images')}
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
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={`${image.path}-${index}`}
            >
              <ImageCard
                image={image}
                onClick={() => handleImageClick(index)}
              />
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
