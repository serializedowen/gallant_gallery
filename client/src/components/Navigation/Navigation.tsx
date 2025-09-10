import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { ViewType } from '../../types';

const Navigation: React.FC = () => {
  const { currentView, setCurrentView, t } = useApp();

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    // Reset selection when changing views
    if (view !== 'categories') {
      // setSelectedCategory(null);
      // setSelectedItem(null);
    }
  };

  return (
    <nav className="filters">
      <div className="container">
        <div className="filter-tabs">
          <div className="view-toggles">
            <button
              className={`view-toggle ${currentView === 'categories' ? 'active' : ''}`}
              onClick={() => handleViewChange('categories')}
            >
              <i className="fas fa-layer-group"></i> 
              <span>{t('nav.categories')}</span>
            </button>
            
            <button
              className={`view-toggle ${currentView === 'folders' ? 'active' : ''}`}
              onClick={() => handleViewChange('folders')}
            >
              <i className="fas fa-folder"></i> 
              <span>{t('nav.folders')}</span>
            </button>
            
            <button
              className={`view-toggle ${currentView === 'grid' ? 'active' : ''}`}
              onClick={() => handleViewChange('grid')}
            >
              <i className="fas fa-th"></i> 
              <span>{t('nav.allImages')}</span>
            </button>
          </div>
          
          <span className="total-count" id="totalCount">
            0 {t('stats.items')}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
