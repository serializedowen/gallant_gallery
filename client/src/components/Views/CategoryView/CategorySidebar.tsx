import React, { useState, useEffect } from 'react';
import { Category } from '../../../types';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';

interface CategorySidebarProps {
  categories: Category[];
  onCategorySelect: (categoryName: string) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ 
  categories, 
  onCategorySelect 
}) => {
  const { selectedCategory, t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(categories);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <aside className="category-sidebar">
      <div className="sidebar-header">
        <h3>{t('category.title')}</h3>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={t('category.search.placeholder')}
          className="category-search"
        />
      </div>
      
      <ul className="category-list">
        {filteredCategories.map((category) => (
          <li key={category.name}>
            <button
              className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => onCategorySelect(category.name)}
            >
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <div className="category-stats">
                  <span className="item-count">
                    {category.totalItems} {t('stats.items')}
                  </span>
                  <span className="image-count">
                    {category.imageCount} {t('stats.images')}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default CategorySidebar;
