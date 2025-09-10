import React from 'react';
import { CategoryItem } from '../../../types';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';

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

  if (!selectedCategory) {
    return (
      <div className="category-content">
        <div className="no-category-selected">
          <i className="fas fa-layer-group"></i>
          <h3>{t('category.select')}</h3>
          <p>{t('category.select.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-content">
      <div className="category-header">
        <h2>{selectedCategory}</h2>
        <div className="category-stats">
          <span>{items.length} {t('stats.items')}</span>
          <span>
            {items.reduce((acc, item) => acc + (item.imageCount || (item.type === 'image' ? 1 : 0)), 0)} {t('stats.images')}
          </span>
        </div>
      </div>
      
      <div className="items-grid">
        {items.length === 0 ? (
          <div className="no-items">
            <i className="fas fa-folder-open"></i>
            <h3>{t('category.noItems')}</h3>
          </div>
        ) : (
          items.map((item, index) => (
            <div 
              key={`${item.path}-${index}`} 
              className="item-card"
              onClick={() => onItemSelect(item)}
            >
              {item.thumbnail && (
                <div className="item-thumbnail">
                  <img
                    src={ApiService.getThumbnailUrl(item.thumbnail)}
                    alt={item.name}
                    loading="lazy"
                  />
                </div>
              )}
              
              <div className="item-info">
                <h4 className="item-name">{item.name}</h4>
                <div className="item-meta">
                  <span className="item-type">
                    <i className={`fas ${item.type === 'folder' ? 'fa-folder' : 'fa-image'}`}></i>
                    {item.type === 'folder' ? 'Folder' : 'Image'}
                  </span>
                  {item.imageCount && (
                    <span className="item-count">
                      {item.imageCount} {t('stats.images')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryContent;
