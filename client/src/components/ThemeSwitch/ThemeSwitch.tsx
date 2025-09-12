import React, { useState } from 'react';
import { useTheme, predefinedColors } from '../../contexts/ThemeContext';
import {
  IconButton,
  Menu,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';

const ThemeSwitch: React.FC = () => {
  const { themeMode, primaryColor, toggleTheme, setPrimaryColor } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleColorSelect = (color: string) => {
    setPrimaryColor(color);
  };

  const ColorSwatch: React.FC<{ color: string; name: string }> = ({ color, name }) => (
    <Tooltip title={name} arrow>
      <Box
        onClick={() => handleColorSelect(color)}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: color,
          cursor: 'pointer',
          border: primaryColor === color ? '3px solid white' : '2px solid transparent',
          boxShadow: primaryColor === color ? '0 0 0 2px rgba(0,0,0,0.3)' : 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          },
        }}
      />
    </Tooltip>
  );

  return (
    <>
      <Tooltip title="Theme Settings" arrow>
        <IconButton
          size="large"
          aria-label="theme settings"
          color="inherit"
          onClick={handleMenuOpen}
          sx={{
            color: primaryColor,
          }}
        >
          <PaletteIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            p: 2,
          },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Theme Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={themeMode === 'dark'}
                onChange={toggleTheme}
                icon={<LightModeIcon />}
                checkedIcon={<DarkModeIcon />}
              />
            }
            label={themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            sx={{ mb: 2 }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Primary Color
        </Typography>
        
        <Grid container spacing={1.5} sx={{ maxWidth: 240 }}>
          {Object.entries(predefinedColors).map(([name, color]) => (
            <Grid item key={name}>
              <ColorSwatch 
                color={color} 
                name={name.charAt(0).toUpperCase() + name.slice(1)} 
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Changes are saved automatically
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default ThemeSwitch;
