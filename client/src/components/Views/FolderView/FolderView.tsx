import React, { useState, useEffect } from 'react';
import { Folder } from '../../../types';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';

const FolderView: React.FC = () => {
  const { isLoading, setIsLoading, t } = useApp();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ApiService.getFolders();
      setFolders(data);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(t('error.loadFolders'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: Folder) => {
    // Here you could navigate to folder detail view or trigger some action
    console.log('Clicked folder:', folder);
  };

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i>
        <h3>{error}</h3>
        <button onClick={loadFolders} className="retry-btn">
          {t('button.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="folder-grid">
      {folders.map((folder) => (
        <div 
          key={folder.path} 
          className="folder-card"
          onClick={() => handleFolderClick(folder)}
        >
          <div className="folder-thumbnail">
            {folder.thumbnail ? (
              <img
                src={ApiService.getThumbnailUrl(folder.thumbnail)}
                alt={folder.name}
                loading="lazy"
              />
            ) : (
              <div className="folder-placeholder">
                <i className="fas fa-folder"></i>
              </div>
            )}
          </div>
          
          <div className="folder-info">
            <h3 className="folder-name">{folder.name}</h3>
            <div className="folder-stats">
              <span className="image-count">
                <i className="fas fa-image"></i>
                {folder.imageCount} {t('stats.images')}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span>{t('loading.folders')}</span>
        </div>
      )}
      
      {!isLoading && folders.length === 0 && (
        <div className="no-results">
          <i className="fas fa-folder-open"></i>
          <h3>{t('error.noResults')}</h3>
          <p>{t('error.noResults.description')}</p>
        </div>
      )}
    </div>
  );
};

export default FolderView;
