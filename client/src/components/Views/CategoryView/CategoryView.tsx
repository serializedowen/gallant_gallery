import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Category, CategoryItem, Image } from '../../../types/api-definitions';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';
import CategorySidebar from './CategorySidebar';
import CategoryContent from './CategoryContent';
import FolderContent from './FolderContent';
import Lightbox from '../../Lightbox/Lightbox';
import { Grid, CircularProgress, Box, Alert, Button } from '@mui/material';

const CategoryView: React.FC = () => {
  const { categoryName, folderName } = useParams<{ categoryName?: string; folderName?: string }>();
  const navigate = useNavigate();
  const {
    selectedCategory,
    setSelectedCategory,
    setSelectedItem,
    isLoading,
    setIsLoading,
    t,
  } = useApp();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<{
    name: string;
    directory: string;
    categoryName?: string;
  } | null>(null);
  const [lightboxImages, setLightboxImages] = useState<Image[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getCategories();
      setCategories(response.categories);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(t('error.loadCategories'));
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, setCategories, t]);

  const loadCategoryItems = useCallback(async (categoryName: string, currentPage: number = 1) => {
    try {
      setIsLoading(currentPage === 1);
      setIsLoadingMore(currentPage > 1);
      setError(null);
      
      const response = await ApiService.getCategoryItems(categoryName, {
        page: currentPage.toString(),
        limit: '20',
      });

      if (currentPage === 1) {
        setCategoryItems(response.items);
      } else {
        setCategoryItems(prev => [...prev, ...response.items]);
      }

      setHasMore(response.hasMore);
      setPage(currentPage);
    } catch (err) {
      console.error('Error loading category items:', err);
      setError(t('error.loadItems'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [setIsLoading, setIsLoadingMore, setError, setCategoryItems, setHasMore, setPage, t]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && selectedCategory) {
      loadCategoryItems(selectedCategory, page + 1);
    }
  }, [isLoadingMore, hasMore, selectedCategory, page, loadCategoryItems]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (categoryName) {
      // URL has a category name, use it
      setSelectedCategory(decodeURIComponent(categoryName));
    } else if (!selectedCategory && categories.length > 0) {
      // No URL category and no selected category, select first one and update URL
      const firstCategory = categories[0].name;
      setSelectedCategory(firstCategory);
      navigate(`/category/${encodeURIComponent(firstCategory)}`, { replace: true });
    }
  }, [categories, categoryName, selectedCategory, navigate, setSelectedCategory]);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryItems(selectedCategory);
    } else {
      setCategoryItems([]);
    }
  }, [selectedCategory, loadCategoryItems, setCategoryItems]);

  // Handle folder selection from URL
  useEffect(() => {
    if (folderName && categoryItems.length > 0) {
      const decodedFolderName = decodeURIComponent(folderName);
      const folder = categoryItems.find(item => item.name === decodedFolderName);
      if (folder) {
        setSelectedFolder({
          name: folder.name,
          directory: folder.path,
          categoryName: selectedCategory || undefined,
        });
        setSelectedItem(folder.name);
      }
    } else if (!folderName) {
      // Clear selected folder if no folder in URL
      setSelectedFolder(null);
      setSelectedItem(null);
    }
  }, [folderName, categoryItems, selectedCategory, setSelectedItem]);

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedItem(null);
    setSelectedFolder(null); // Clear selected folder when changing category
    navigate(`/category/${encodeURIComponent(categoryName)}`);
  };

  const handleItemSelect = (item: CategoryItem) => {
    setSelectedItem(item.name);
    setSelectedFolder({
      name: item.name,
      directory: item.path,
      categoryName: selectedCategory || undefined,
    });
    // Navigate to the folder URL within the category
    navigate(`/category/${encodeURIComponent(selectedCategory!)}/folder/${encodeURIComponent(item.name)}`);
    console.log('Selected item:', item);
  };

  const handleImageClick = (index: number, images: Image[]) => {
    setLightboxImages(images);
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    setLightboxImages([]);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;

    let newIndex = selectedImageIndex;
    if (direction === 'prev') {
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : lightboxImages.length - 1;
    } else {
      newIndex = selectedImageIndex < lightboxImages.length - 1 ? selectedImageIndex + 1 : 0;
    }
    setSelectedImageIndex(newIndex);
  };

  if (error) {
    return (
      <Alert
        severity='error'
        action={<Button onClick={loadCategories}>{t('button.retry')}</Button>}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <CategorySidebar
          categories={categories}
          onCategorySelect={handleCategorySelect}
        />
      </Grid>
      <Grid item xs={12} md={9}>
        {selectedFolder ? (
          <FolderContent
            selectedFolder={selectedFolder}
            onImageClick={handleImageClick}
          />
        ) : (
          <CategoryContent
            selectedCategory={selectedCategory}
            items={categoryItems}
            selectedFolderName={selectedFolder?.name || null}
            onItemSelect={handleItemSelect}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
          />
        )}
        {hasMore && (
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            {isLoadingMore ? <CircularProgress size={24} /> : t('button.loadMore')}
          </Button>
        )}
      </Grid>
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {selectedImageIndex !== null && (
        <Lightbox
          images={lightboxImages}
          currentIndex={selectedImageIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </Grid>
  );
};

export default CategoryView;
