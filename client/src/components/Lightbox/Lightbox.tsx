import React, { useEffect, useCallback } from 'react';
import { Image } from '../../types/api-definitions';
import { useApp } from '../../contexts/AppContext';
import ApiService from '../../services/api';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Grid,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Api,
} from '@mui/icons-material';

interface LightboxProps {
  images: Image[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const { t } = useApp();
  const currentImage = images[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onNavigate('prev');
          break;
        case 'ArrowRight':
          onNavigate('next');
          break;
        default:
          break;
      }
    },
    [onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!currentImage) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 0,
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
      }}
    >
      <Fade in={true} timeout={500}>
        <IconButton
          aria-label='close'
          onClick={() => {
            console.log('second');
            onClose();
          }}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              transform: 'scale(1.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Fade>

      <Fade in={true} timeout={600}>
        <IconButton
          aria-label='previous'
          onClick={() => onNavigate('prev')}
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              transform: 'translateY(-50%) scale(1.1)',
            },
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
      </Fade>

      <Fade in={true} timeout={600}>
        <IconButton
          aria-label='next'
          onClick={() => onNavigate('next')}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              transform: 'translateY(-50%) scale(1.1)',
            },
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </Fade>

      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
          }}
        >
          <Zoom in={true} timeout={400}>
            <Box
              component='img'
              src={ApiService.getImageUrl(currentImage.path)}
              alt={currentImage.metadata.filename}
              sx={{
                maxHeight: '80vh',
                maxWidth: '80vw',
                objectFit: 'contain',
                transition: 'all 0.3s ease-in-out',
              }}
            />
          </Zoom>
          <Fade in={true} timeout={600}>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 2,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                color: 'white',
              }}
            >
              <Typography variant='h6'>
                {currentImage.metadata.filename}
              </Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Typography variant='body2'>
                    {t('lightbox.size')}:{' '}
                    {formatFileSize(currentImage.metadata.size)}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant='body2'>
                    {t('lightbox.dimensions')}:{' '}
                    {currentImage.metadata.width && currentImage.metadata.height
                      ? `${currentImage.metadata.width} × ${currentImage.metadata.height}`
                      : 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant='body2'>
                    {t('lightbox.format')}: {currentImage.metadata.format}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant='body2'>
                    {t('lightbox.directory')}: {currentImage.directory}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Lightbox;
