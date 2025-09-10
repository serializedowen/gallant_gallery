import React, { useState, useEffect } from 'react';
import { Category, CategoryItem } from '../../../types';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';
import CategorySidebar from './CategorySidebar';
import CategoryContent from './CategoryContent';

const CategoryView: React.FC = () => {
  const { 
    selectedCategory, 
    setSelectedCategory, 
    selectedItem, 
    setSelectedItem,
    isLoading,
    setIsLoading,
    t 
  } = useApp();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

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
      const data = await ApiService.getCategories();
      setCategories(data);
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
      const items = await ApiService.getCategoryItems(categoryName);
      setCategoryItems(items);
    } catch (err) {
      console.error('Error loading category items:', err);
      setError(t('error.loadItems'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedItem(null); // Reset selected item when changing category
  };

  const handleItemSelect = (item: CategoryItem) => {
    setSelectedItem(item.name);
    // Here you could trigger navigation to a detail view or open lightbox
    console.log('Selected item:', item);
  };

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i>
        <h3>{error}</h3>
        <button onClick={loadCategories} className="retry-btn">
          {t('button.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="category-layout">
      <CategorySidebar 
        categories={categories}
        onCategorySelect={handleCategorySelect}
      />
      
      <CategoryContent
        selectedCategory={selectedCategory}
        items={categoryItems}
        onItemSelect={handleItemSelect}
      />
      
      {isLoading && (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span>
            {selectedCategory ? t('loading.items') : t('loading.categories')}
          </span>
        </div>
      )}
    </div>
  );
};

export default CategoryView;
