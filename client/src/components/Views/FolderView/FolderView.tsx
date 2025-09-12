import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder } from '../../../types/api-definitions';
import { useApp } from '../../../contexts/AppContext';
import ApiService from '../../../services/api';
import { ImageSlideshow } from '../../common';
import {
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';

const FolderView: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, setIsLoading, t, setSelectedPath } = useApp();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getFolders();
      setFolders(response.folders);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(t('error.loadFolders'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: Folder) => {
    setSelectedPath(folder.directory);
    navigate(`/folder/${encodeURIComponent(folder.displayName)}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('loading.folders')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadFolders}>
            {t('button.retry')}
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (folders.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <FolderIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6">{t('error.noResults')}</Typography>
        <Typography>{t('error.noResults.description')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {folders.map((folder) => (
          <Grid item key={folder.directory} xs={12} sm={6} md={4} lg={3}>
            <Card>
              <CardActionArea onClick={() => handleFolderClick(folder)}>
                <ImageSlideshow
                  mainImage={folder.mainImage}
                  additionalImages={folder.additionalImages}
                  alt={folder.displayName}
                  height={160}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {folder.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {folder.totalCount} {t('stats.images')}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FolderView;
