import React from 'react';
import { CategoryItem } from '../../../types/api-definitions';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Paper,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ImageIcon from '@mui/icons-material/Image';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CategoryIcon from '@mui/icons-material/Category';

interface CategoryContentProps {
  selectedCategory: string | null;
  items: CategoryItem[];
  onItemSelect: (item: CategoryItem) => void;
}

const CategoryContent: React.FC<CategoryContentProps> = ({
  selectedCategory,
  items,
  onItemSelect,
}) => {
  const { t } = useApp();


  console.log(items)

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
        <Typography variant="h5" gutterBottom>
          {t('category.select')}
        </Typography>
        <Typography variant="body1">{t('category.select.description')}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          {selectedCategory}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary' }}>
          <Typography variant="body2">
            {items.length} {t('stats.items')}
          </Typography>
          <Typography variant="body2">
            {items.reduce(
              (acc, item) =>
                acc + item.imageCount,
              0
            )}{' '}
            {t('stats.images')}
          </Typography>
        </Box>
      </Box>

      {items.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100% - 100px)', // Adjust based on header height
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          <FolderOpenIcon sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6">{t('category.noItems')}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((item, index) => (
            <Grid item key={`${item.path}-${index}`} xs={12} sm={6} md={4} lg={3}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea
                  onClick={() => onItemSelect(item)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  {item.mainImage && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={ApiService.getThumbnailUrl(item.mainImage.thumbnail)}
                      alt={item.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {item.name}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.secondary',
                        mt: 1,
                      }}
                    >
                      <FolderIcon sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ mr: 2 }}>
                        Folder
                      </Typography>
                      {item.imageCount && (
                        <Typography variant="body2">
                          {item.imageCount} {t('stats.images')}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default CategoryContent;
