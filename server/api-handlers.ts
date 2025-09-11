/**
 * API Route Handlers for Gallant Gallery
 * This file contains the actual implementation of API endpoints using the type definitions
 */

import { Router } from 'express';
import {
  ApiHandler,
  CategoriesResponse,
  CategoryItemsResponse,
  ItemImagesResponse,
  ImagesResponse,
  FoldersResponse,
  ImageResponse,
  RefreshResponse,
  DaemonResponse,
  DaemonStatus,
  RebuildIndexResponse,
  IndexStats,
  HealthResponse,
  ErrorResponse,
  ApiError,
  HTTP_STATUS,
} from './api-definitions';

// Import your existing service functions here
// These would need to be extracted from server.js
declare function getAllCategories(): Promise<any>;
declare function getCategoryItems(categoryPath: string): Promise<any>;
declare function scanImagesDirectory(dir: string, relativePath?: string): Promise<any>;
declare function getAllImages(): Promise<any>;
declare function getImageMetadata(imagePath: string): Promise<any>;
declare function generateThumbnail(imagePath: string, thumbnailPath: string, size?: number, force?: boolean): Promise<boolean>;
declare function isImageUpToDate(imagePath: string, thumbnailPath: string): Promise<boolean>;
declare function getThumbnailInfo(imagePath: string): { id: string; thumbnailPath: string };

// Mock cache and daemon objects - these would be imported from your main server file
declare const cache: any;
declare const thumbnailDaemon: any;
declare const thumbnailIndex: any;
declare const IMAGES_DIR: string;
declare const THUMBNAIL_INDEX_FILE: string;

// ============================================
// Route Handlers
// ============================================

// GET /api/categories
export const getCategories: ApiHandler<'GET /api/categories'> = async (req, res) => {
  try {
    const categories = await getAllCategories();
    
    // Get item count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category: any) => {
        const items = await getCategoryItems(category.path);
        const totalImages = items.reduce((sum: number, item: any) => sum + item.imageCount, 0);
        
        return {
          name: category.name,
          path: category.path,
          itemCount: items.length,
          imageCount: totalImages,
        };
      })
    );

    const response: CategoriesResponse = {
      categories: categoriesWithCounts,
      totalCategories: categoriesWithCounts.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// GET /api/categories/:categoryPath/items
export const getCategoryItemsHandler: ApiHandler<'GET /api/categories/:categoryPath/items'> = async (req, res) => {
  try {
    const categoryPath = decodeURIComponent(req.params.categoryPath);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search || '';

    const items = await getCategoryItems(categoryPath);

    // Filter by search term if provided
    let filteredItems = items;
    if (search) {
      filteredItems = items.filter((item: any) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // Generate thumbnails and metadata for items
    const itemsWithThumbnails = await Promise.all(
      paginatedItems.map(async (item: any) => {
        // Get the first image as the main thumbnail
        const mainImage = item.images[0];
        const { id: thumbnailId, thumbnailPath } = getThumbnailInfo(mainImage.path);

        // Generate thumbnail if needed
        const isUpToDate = await isImageUpToDate(mainImage.fullPath, thumbnailPath);
        if (!isUpToDate) {
          await generateThumbnail(mainImage.fullPath, thumbnailPath);
        }

        const metadata = await getImageMetadata(mainImage.fullPath);

        return {
          name: item.name,
          path: item.path,
          category: item.category,
          imageCount: item.imageCount,
          mainImage: {
            id: thumbnailId,
            path: mainImage.path,
            thumbnail: `/thumbnails/${thumbnailId}`,
            metadata: metadata,
          },
        };
      })
    );

    const response: CategoryItemsResponse = {
      items: itemsWithThumbnails,
      totalCount: filteredItems.length,
      page,
      limit,
      hasMore: endIndex < filteredItems.length,
      category: categoryPath,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category items:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// GET /api/items/:categoryPath/:itemName/images
export const getItemImages: ApiHandler<'GET /api/items/:categoryPath/:itemName/images'> = async (req, res) => {
  try {
    const categoryPath = decodeURIComponent(req.params.categoryPath);
    const itemName = decodeURIComponent(req.params.itemName);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const items = await getCategoryItems(categoryPath);
    const item = items.find((i: any) => i.name === itemName);

    if (!item) {
      const errorResponse: ErrorResponse = { error: 'Item not found' };
      res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = item.images.slice(startIndex, endIndex);

    // Generate thumbnails and metadata for images
    const imagesWithThumbnails = await Promise.all(
      paginatedImages.map(async (img: any) => {
        const { id: thumbnailId, thumbnailPath } = getThumbnailInfo(img.path);

        // Generate thumbnail if needed
        const isUpToDate = await isImageUpToDate(img.fullPath, thumbnailPath);
        if (!isUpToDate) {
          await generateThumbnail(img.fullPath, thumbnailPath);
        }

        const metadata = await getImageMetadata(img.fullPath);

        return {
          id: thumbnailId,
          path: img.path,
          thumbnail: `/thumbnails/${thumbnailId}`,
          directory: img.directory,
          metadata: metadata,
        };
      })
    );

    const response: ItemImagesResponse = {
      images: imagesWithThumbnails,
      totalCount: item.images.length,
      page,
      limit,
      hasMore: endIndex < item.images.length,
      item: {
        name: item.name,
        path: item.path,
        category: item.category,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching item images:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// GET /api/images
export const getImages: ApiHandler<'GET /api/images'> = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search || '';

    let searchObj: any = {};
    if (search) {
      // Parse search string like a="1"&b="2" into an object
      search.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key && value) {
          // Remove surrounding quotes if present
          searchObj[key] = value.replace(/^"|"$/g, '');
        }
      });

      if (Object.keys(searchObj).length === 0) {
        searchObj.keyword = search;
      }
    }

    let images = await getAllImages();

    // Filter by search term
    if (Object.keys(searchObj).length > 0) {
      images = images
        .filter((img: any) => {
          if (searchObj.dir) {
            return img.path.includes(searchObj.dir);
          }
          return true;
        })
        .filter((img: any) => {
          if (searchObj.keyword)
            return img.path
              .toLowerCase()
              .includes(searchObj.keyword.toLowerCase());
          return true;
        });
    }

    // Sort by path
    images.sort((a: any, b: any) => a.path.localeCompare(b.path));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = images.slice(startIndex, endIndex);

    const timeStart = Date.now();
    // Generate thumbnails and get metadata for requested images
    const imageData = await Promise.all(
      paginatedImages.map(async (img: any) => {
        const { id: thumbnailId, thumbnailPath } = getThumbnailInfo(img.path);

        // Generate thumbnail using lazy loading (only if not up to date)
        const isUpToDate = await isImageUpToDate(img.fullPath, thumbnailPath);

        if (!isUpToDate) {
          await generateThumbnail(img.fullPath, thumbnailPath);
        }

        const metadata = await getImageMetadata(img.fullPath);

        return {
          id: thumbnailId,
          path: img.path,
          thumbnail: `/thumbnails/${thumbnailId}`,
          directory: img.directory,
          metadata: metadata,
        };
      })
    );

    console.log(
      `Processed ${imageData.length} images in ${Date.now() - timeStart}ms`
    );

    const response: ImagesResponse = {
      images: imageData,
      totalCount: images.length,
      page,
      limit,
      hasMore: endIndex < images.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching images:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// GET /api/health
export const healthCheck: ApiHandler<'GET /health'> = (req, res) => {
  try {
    const response: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      daemon: thumbnailDaemon.getStatus().isWatching,
    };
    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    console.error('Error in health check:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// POST /api/refresh
export const refreshCache: ApiHandler<'POST /api/refresh'> = async (req, res) => {
  try {
    cache.flushAll();
    const images = await getAllImages();
    const categories = await getAllCategories();
    
    const response: RefreshResponse = {
      message: 'Cache refreshed',
      imageCount: images.length,
      categoryCount: categories.length,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error refreshing cache:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// GET /api/daemon/status
export const getDaemonStatus: ApiHandler<'GET /api/daemon/status'> = (req, res) => {
  try {
    const status: DaemonStatus = thumbnailDaemon.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting daemon status:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// POST /api/daemon/start
export const startDaemon: ApiHandler<'POST /api/daemon/start'> = (req, res) => {
  try {
    thumbnailDaemon.start();
    const response: DaemonResponse = { message: 'Thumbnail daemon started' };
    res.json(response);
  } catch (error) {
    console.error('Error starting daemon:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to start daemon' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// POST /api/daemon/stop
export const stopDaemon: ApiHandler<'POST /api/daemon/stop'> = (req, res) => {
  try {
    thumbnailDaemon.stop();
    const response: DaemonResponse = { message: 'Thumbnail daemon stopped' };
    res.json(response);
  } catch (error) {
    console.error('Error stopping daemon:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to stop daemon' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// ============================================
// Router Setup
// ============================================

export function createApiRouter(): Router {
  const router = Router();

  // Category routes
  router.get('/categories', getCategories);
  router.get('/categories/:categoryPath/items', getCategoryItemsHandler);

  // Item routes
  router.get('/items/:categoryPath/:itemName/images', getItemImages);

  // Image routes
  router.get('/images', getImages);

  // Cache routes
  router.post('/refresh', refreshCache);

  // Daemon routes
  router.get('/daemon/status', getDaemonStatus);
  router.post('/daemon/start', startDaemon);
  router.post('/daemon/stop', stopDaemon);

  // Health check
  router.get('/health', healthCheck);

  return router;
}

// ============================================
// Error Handling Middleware
// ============================================

export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  if (err instanceof ApiError) {
    const errorResponse: ErrorResponse = { error: err.message };
    return res.status(err.statusCode).json(errorResponse);
  }

  console.error('Unhandled error:', err);
  const errorResponse: ErrorResponse = { error: 'Internal server error' };
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
};

// ============================================
// Export all handlers for individual use
// ============================================

export const handlers = {
  getCategories,
  getCategoryItems: getCategoryItemsHandler,
  getItemImages,
  getImages,
  healthCheck,
  refreshCache,
  getDaemonStatus,
  startDaemon,
  stopDaemon,
} as const;
