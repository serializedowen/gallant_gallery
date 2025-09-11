import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import ApiService from '../../services/api';
import { DaemonStatus } from '../../types/api-definitions';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Image as ImageIcon,
  Storage as DatabaseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface DaemonModalProps {
  open: boolean;
  onClose: () => void;
  daemonStatus: DaemonStatus | null;
  onStatusUpdate: (status: DaemonStatus) => void;
}

const DaemonModal: React.FC<DaemonModalProps> = ({
  open,
  onClose,
  daemonStatus,
  onStatusUpdate,
}) => {
  const { t } = useApp();
  const [loading, setLoading] = useState<string | null>(null);

  const updateDaemonStatus = useCallback(async () => {
    try {
      const status = await ApiService.getDaemonStatus();
      onStatusUpdate(status);
    } catch (error) {
      console.error('Error updating daemon status:', error);
    }
  }, [onStatusUpdate]);

  useEffect(() => {
    if (open) {
      updateDaemonStatus();
    }
  }, [open, updateDaemonStatus]);

  const handleControlDaemon = async (action: 'start' | 'stop') => {
    setLoading(action);
    try {
      const response = action === 'start' 
        ? await ApiService.startDaemon()
        : await ApiService.stopDaemon();
      
      console.log(response.message);
      
      // Update status after a short delay
      setTimeout(() => {
        updateDaemonStatus();
      }, 500);
    } catch (error) {
      console.error(`Error ${action}ing daemon:`, error);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateAllThumbnails = async () => {
    setLoading('generate');
    try {
      const response = await ApiService.generateAllThumbnails();
      console.log(response.message);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    } finally {
      setTimeout(() => setLoading(null), 2000);
    }
  };

  const handleRebuildIndex = async () => {
    setLoading('rebuild');
    try {
      const response = await ApiService.rebuildIndex();
      console.log(response.message);
      
      // Update status after a short delay
      setTimeout(() => {
        updateDaemonStatus();
      }, 500);
    } catch (error) {
      console.error('Error rebuilding index:', error);
    } finally {
      setTimeout(() => setLoading(null), 2000);
    }
  };

  const formatQueueInfo = (status: DaemonStatus) => {
    if (status.processingQueue && status.processingQueue.length > 0) {
      return status.processingQueue.join(', ');
    }
    return t('daemon.queue.empty') || 'Empty';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <DatabaseIcon />
            <Typography variant="h6">
              {t('daemon.title')}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {daemonStatus && (
          <Box>
            {/* Status Overview */}
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      {t('daemon.status')}:
                    </Typography>
                    <Chip
                      label={
                        daemonStatus.isWatching
                          ? t('daemon.status.running')
                          : t('daemon.status.stopped')
                      }
                      color={daemonStatus.isWatching ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      {t('daemon.watching')}:
                    </Typography>
                    <Typography variant="body2" noWrap>
                      {daemonStatus.watchedDirectory || '-'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Detailed Statistics */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2" color="textSecondary">
                      {t('daemon.queue')}
                    </Typography>
                    <Typography variant="h6">
                      {formatQueueInfo(daemonStatus)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2" color="textSecondary">
                      {t('daemon.indexEntries')}
                    </Typography>
                    <Typography variant="h6">
                      {daemonStatus.thumbnailIndex 
                        ? `${daemonStatus.thumbnailIndex.totalEntries} total`
                        : 'Unknown'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box p={2} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2" color="textSecondary">
                      {t('daemon.metadataCache')}
                    </Typography>
                    <Typography variant="h6">
                      {daemonStatus.thumbnailIndex 
                        ? `${daemonStatus.thumbnailIndex.entriesWithMetadata} cached (${daemonStatus.thumbnailIndex.cacheHitRate})`
                        : 'Unknown'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Thumbnail Index Info */}
            <Box mb={3}>
              <Box p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body2" color="textSecondary">
                  {t('daemon.thumbnailIndex')}
                </Typography>
                <Typography variant="h6">
                  {daemonStatus.thumbnailIndex 
                    ? `${daemonStatus.thumbnailIndex.totalEntries} thumbnails`
                    : 'Unknown'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Box display="flex" gap={1} width="100%" justifyContent="space-between">
          {/* Control buttons */}
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={
                loading === 'start' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <PlayIcon />
                )
              }
              onClick={() => handleControlDaemon('start')}
              disabled={loading !== null || daemonStatus?.isWatching}
            >
              {t('daemon.start')}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={
                loading === 'stop' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <StopIcon />
                )
              }
              onClick={() => handleControlDaemon('stop')}
              disabled={loading !== null || !daemonStatus?.isWatching}
            >
              {t('daemon.stop')}
            </Button>
          </Box>

          {/* Action buttons */}
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={
                loading === 'generate' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <ImageIcon />
                )
              }
              onClick={handleGenerateAllThumbnails}
              disabled={loading !== null}
            >
              {t('daemon.generateAll')}
            </Button>
            <Button
              variant="outlined"
              startIcon={
                loading === 'rebuild' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DatabaseIcon />
                )
              }
              onClick={handleRebuildIndex}
              disabled={loading !== null}
            >
              {t('daemon.rebuildIndex')}
            </Button>
            <IconButton onClick={updateDaemonStatus} disabled={loading !== null}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default DaemonModal;
