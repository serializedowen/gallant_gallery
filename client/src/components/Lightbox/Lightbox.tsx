import React, { useEffect, useCallback, useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Lightbox.css';
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
  const sliderRef = useRef<Slider>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          sliderRef.current?.slickPrev();
          break;
        case 'ArrowRight':
          sliderRef.current?.slickNext();
          break;
        default:
          break;
      }
    },
    [onClose]
  );

  const sliderSettings = {
    // dots: true,
    infinite: true,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: currentIndex,
    swipeToSlide: true,
    touchThreshold: 10,
    arrows: false,
    customPaging: (i: number) => (
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          },
        }}
      />
    ),
    dotsClass: 'slick-dots custom-dots',
  };

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
          onClick={() => sliderRef.current?.slickPrev()}
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
          onClick={() => sliderRef.current?.slickNext()}
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

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <Box
          className='lightbox-slider'
          sx={{
            height: '80vh',
            '& .slick-slider': {
              height: '100%',
            },
            '& .slick-list': {
              height: '100%',
            },
            '& .slick-track': {
              height: '100%',
            },
            '& .slick-slide': {
              height: '100%',
              '& > div': {
                height: '100%',
              },
            },
          }}
        >
          <Slider ref={sliderRef} {...sliderSettings}>
            {images.map((image, index) => (
              <Box
                key={image.id}
                sx={{
                  height: '80vh',
                  display: 'flex !important',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Box
                  component='img'
                  src={ApiService.getImageUrl(image.path)}
                  alt={image.metadata.filename}
                  sx={{
                    maxHeight: '80vh',
                    maxWidth: '90vw',
                    objectFit: 'contain',
                    userSelect: 'none',
                  }}
                />

                {/* Image info overlay */}
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
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant='h6' noWrap>
                        {image.metadata.filename}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ opacity: 0.8, minWidth: 'fit-content', ml: 2 }}
                      >
                        {index + 1} / {images.length}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant='body2'>
                          {t('lightbox.size')}:{' '}
                          {formatFileSize(image.metadata.size)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant='body2'>
                          {t('lightbox.dimensions')}:{' '}
                          {image.metadata.width && image.metadata.height
                            ? `${image.metadata.width} × ${image.metadata.height}`
                            : 'Unknown'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant='body2'>
                          {t('lightbox.format')}: {image.metadata.format}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant='body2' noWrap>
                          {t('lightbox.directory')}: {image.directory}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              </Box>
            ))}
          </Slider>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Lightbox;
