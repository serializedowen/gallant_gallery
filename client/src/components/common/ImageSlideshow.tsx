import React from 'react';
import Slider from 'react-slick';
import { Box, CardMedia } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { ImageThumbnail } from '../../types/api-definitions';
import ApiService from '../../services/api';

interface ImageSlideshowProps {
  mainImage?: ImageThumbnail;
  additionalImages: ImageThumbnail[];
  alt: string;
  height?: number;
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({
  mainImage,
  additionalImages,
  alt,
  height = 160,
}) => {
  // Combine mainImage and additionalImages
  const allImages = mainImage ? [mainImage, ...additionalImages] : additionalImages;

  // If no images, show folder icon
  if (allImages.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.200',
        }}
      >
        <FolderIcon sx={{ fontSize: 80, color: 'grey.500' }} />
      </Box>
    );
  }

  // If only one image, show it without slider
  if (allImages.length === 1) {
    return (
      <CardMedia
        component="img"
        height={height}
        image={ApiService.getThumbnailUrl(allImages[0].thumbnail)}
        alt={alt}
        sx={{ objectFit: 'cover' }}
      />
    );
  }

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: false,
  };

  return (
    <Box sx={{ position: 'relative', height }}>
      <Slider {...sliderSettings}>
        {allImages.map((image, index) => (
          <Box key={`${image.id}-${index}`}>
            <CardMedia
              component="img"
              height={height}
              image={ApiService.getThumbnailUrl(image.thumbnail)}
              alt={`${alt} - Image ${index + 1}`}
              sx={{ objectFit: 'cover' }}
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default ImageSlideshow;
