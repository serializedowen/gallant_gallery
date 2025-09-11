import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import ApiService from '../../services/api';
import { DaemonStatus } from '../../types/api-definitions';
import DaemonModal from '../DaemonModal/DaemonModal';
import {
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  IconButton,
  Menu,
  MenuItem,
  Box,
} from '@mui/material';
import {
  Search as SearchIcon,
  Language as LanguageIcon,
  Refresh as RefreshIcon,
  Adb as AdbIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Header: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    setCurrentLanguage,
    t,
  } = useApp();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [daemonModalOpen, setDaemonModalOpen] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState<DaemonStatus | null>(null);

  // Update daemon status periodically
  useEffect(() => {
    const updateDaemonStatus = async () => {
      try {
        const status = await ApiService.getDaemonStatus();
        setDaemonStatus(status);
      } catch (error) {
        console.error('Error updating daemon status:', error);
        setDaemonStatus(null);
      }
    };

    updateDaemonStatus();
    const interval = setInterval(updateDaemonStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (lang: 'zh' | 'en') => {
    setCurrentLanguage(lang);
    handleLanguageClose();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDaemonClick = () => {
    setDaemonModalOpen(true);
  };

  const handleDaemonModalClose = () => {
    setDaemonModalOpen(false);
  };

  const handleDaemonStatusUpdate = (status: DaemonStatus) => {
    setDaemonStatus(status);
  };

  const getDaemonStatusColor = () => {
    if (!daemonStatus) return 'error';
    return daemonStatus.isWatching ? 'success' : 'error';
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
        <Typography
          variant="h6"
          noWrap
          component="a"
          href="/"
          sx={{
            mr: 2,
            display: { xs: 'none', md: 'flex' },
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '.3rem',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          GALLERY
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder={t('search.placeholder')}
            inputProps={{ 'aria-label': 'search' }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Search>
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <IconButton
            size="large"
            aria-label="show language menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleLanguageMenu}
            color="inherit"
          >
            <LanguageIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleLanguageClose}
          >
            <MenuItem onClick={() => handleLanguageSelect('zh')}>中文</MenuItem>
            <MenuItem onClick={() => handleLanguageSelect('en')}>English</MenuItem>
          </Menu>
          <IconButton
            size="large"
            aria-label="refresh page"
            color="inherit"
            onClick={handleRefresh}
          >
            <RefreshIcon />
          </IconButton>
          <IconButton
            size="large"
            aria-label="daemon status"
            color="inherit"
            onClick={handleDaemonClick}
            sx={{
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: getDaemonStatusColor() === 'success' ? 'success.main' : 'error.main',
              },
            }}
          >
            <AdbIcon />
          </IconButton>
        </Box>

        <DaemonModal
          open={daemonModalOpen}
          onClose={handleDaemonModalClose}
          daemonStatus={daemonStatus}
          onStatusUpdate={handleDaemonStatusUpdate}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
