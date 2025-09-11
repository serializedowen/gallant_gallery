import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Category as CategoryIcon,
  Folder as FolderIcon,
  Apps as AppsIcon,
} from '@mui/icons-material';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useApp();

  // Determine current value based on route
  const getCurrentValue = () => {
    if (location.pathname.startsWith('/category') || location.pathname === '/categories') {
      return 'categories';
    } else if (location.pathname.startsWith('/folder') || location.pathname === '/folders') {
      return 'folders';
    } else if (location.pathname === '/grid') {
      return 'grid';
    }
    return 'categories';
  };

  const handleViewChange = (event: React.SyntheticEvent, newValue: string) => {
    switch (newValue) {
      case 'categories':
        navigate('/categories');
        break;
      case 'folders':
        navigate('/folders');
        break;
      case 'grid':
        navigate('/grid');
        break;
    }
  };

  return (
    <Paper
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getCurrentValue()}
        onChange={handleViewChange}
      >
        <BottomNavigationAction
          label={t('nav.categories')}
          value="categories"
          icon={<CategoryIcon />}
        />
        <BottomNavigationAction
          label={t('nav.folders')}
          value="folders"
          icon={<FolderIcon />}
        />
        <BottomNavigationAction
          label={t('nav.allImages')}
          value="grid"
          icon={<AppsIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;
