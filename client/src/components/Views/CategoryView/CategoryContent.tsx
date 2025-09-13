import React, { useEffect, useRef, useCallback } from 'react';
import { CategoryItem } from '../../../types/api-definitions';
import { useApp } from '../../../contexts/AppContext';
import { ImageSlideshow } from '../../common';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';

interface CategoryContentProps {
  selectedCategory: string | null;
  items: CategoryItem[];
  selectedFolderName?: string | null;
  onItemSelect: (item: CategoryItem) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

const CategoryContent: React.FC<CategoryContentProps> = ({
  selectedCategory,
  items,
  selectedFolderName,
  onItemSelect,
  hasMore,
  isLoadingMore,
  onLoadMore,
}) => {
  const { t } = useApp();
  const observerTarget = useRef<HTMLDivElement>(null);

  const intersectionObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(intersectionObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [intersectionObserver]);

  if (!selectedCategory) {
    return (
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
        <CategoryIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant='h5' gutterBottom>
          {t('category.select')}
        </Typography>
        <Typography variant='body1'>
          {t('category.select.description')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.path}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                transition:
                  'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              }}
            >
              <CardActionArea
                onClick={() => onItemSelect(item)}
                sx={{ height: '100%' }}
              >
                <ImageSlideshow
                  mainImage={item.mainImage}
                  additionalImages={[]}
                  alt={item.name}
                  height={200}
                />
                <CardContent>
                  <Typography
                    gutterBottom
                    variant='h6'
                    component='div'
                    noWrap
                  >
                    {item.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {item.imageCount}{t('stats.images')}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Intersection Observer Target */}
      <Box
        ref={observerTarget}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: 2,
          mt: 2,
          minHeight: '100px',
        }}
      >
        {isLoadingMore && <CircularProgress />}
      </Box>
    </Box>
  );
};

export default CategoryContent;
