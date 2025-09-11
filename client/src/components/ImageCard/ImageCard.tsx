import React from 'react';
import { Image } from '../../types/api-definitions';
import ApiService from '../../services/api';
import {
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Box,
} from '@mui/material';

interface ImageCardProps {
  image: Image;
  onClick: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onClick }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick}>
        <CardMedia
          component="img"
          height="140"
          image={ApiService.getThumbnailUrl(image.thumbnail)}
          alt={image.metadata.filename}
        />
        <CardContent>
          <Typography
            gutterBottom
            variant="h6"
            component="div"
            noWrap
            title={image.metadata.filename}
          >
            {image.metadata.filename}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              {formatFileSize(image.metadata.size)}
            </Typography>
            <Typography variant="body2">
              {image.metadata.width && image.metadata.height 
                ? `${image.metadata.width} × ${image.metadata.height}`
                : 'Unknown'}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ImageCard;
