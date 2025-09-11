import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Category, CategoryItem } from '../../../types/api-definitions';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';
import CategorySidebar from './CategorySidebar';
import CategoryContent from './CategoryContent';
import { Grid, CircularProgress, Box, Alert, Button } from '@mui/material';

const CategoryView: React.FC = () => {
  const { categoryName } = useParams<{ categoryName?: string }>();
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

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
  }, [categories, categoryName, selectedCategory, navigate]);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryItems(selectedCategory);
    } else {
      setCategoryItems([]);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
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
  };

  const loadCategoryItems = async (categoryName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getCategoryItems(categoryName);
      setCategoryItems(response.items);
    } catch (err) {
      console.error('Error loading category items:', err);
      setError(t('error.loadItems'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedItem(null);
    navigate(`/category/${encodeURIComponent(categoryName)}`);
  };

  const handleItemSelect = (item: CategoryItem) => {
    setSelectedItem(item.name);
    // Navigate to folder view since category items are typically folders
    navigate(`/folder/${encodeURIComponent(item.name)}`);
    console.log('Selected item:', item);
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
        <CategoryContent
          selectedCategory={selectedCategory}
          items={categoryItems}
          onItemSelect={handleItemSelect}
        />
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
    </Grid>
  );
};

export default CategoryView;
