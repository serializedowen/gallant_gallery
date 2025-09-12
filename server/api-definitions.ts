/**
 * API Endpoint Definitions for Gallant Gallery
 * This file contains all API endpoint definitions, types, and interfaces
 */

import type { Request, Response } from 'express';

// Express type aliases for better compatibility
export type ApiRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  Query = any
> = Request<P, ResBody, ReqBody, Query>;
export type ExpressResponse<T = any> = Response<T>;

// ============================================
// Type Definitions
// ============================================

export interface ImageThumbnail {
  id: string;
  path: string;
  thumbnail: string;
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  filename: string;
  size: number;
  width: number | null;
  height: number | null;
  format: string;
  lastModified: Date;
}

export interface Image {
  id: string;
  path: string;
  thumbnail: string;
  directory: string;
  metadata: ImageMetadata;
}

export interface Category {
  name: string;
  path: string;
  itemCount: number;
  imageCount: number;
}

export interface CategoryItem {
  name: string;
  path: string;
  category: string;
  imageCount: number;
  mainImage: ImageThumbnail;
  additionalImages: Array<ImageThumbnail>;
}

export interface ItemImage {
  id: string;
  path: string;
  thumbnail: string;
  directory: string;
  metadata: ImageMetadata;
}

export interface Folder {
  directory: string;
  displayName: string;
  totalCount: number;
  mainImage: ImageThumbnail;
  additionalImages: Array<ImageThumbnail>;
  hasMore: boolean;
}

export interface DaemonStatus {
  isWatching: boolean;
  processingQueue: string[];
  watchedDirectory: string;
  thumbnailIndex: {
    totalEntries: number;
    entriesWithMetadata: number;
    indexFile: string;
    cacheHitRate: number;
  };
}

export interface IndexStats {
  totalEntries: number;
  entriesWithMetadata: number;
  entriesWithThumbnails: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  indexFile: string;
  indexSize: number;
}

// ============================================
// Request/Response Type Interfaces
// ============================================

// Query parameters
export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface SearchQuery extends PaginationQuery {
  search?: string;
}

// Route parameters
export interface CategoryPathParams {
  categoryPath: string;
}

export interface ItemPathParams {
  categoryPath: string;
  itemName: string;
}

export interface ImageIdParams {
  id: string;
}

// Response types
export interface CategoriesResponse {
  categories: Category[];
  totalCategories: number;
}

export interface CategoryItemsResponse {
  items: CategoryItem[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  category: string;
}

export interface ItemImagesResponse {
  images: ItemImage[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  item: {
    name: string;
    path: string;
    category: string;
  };
}

export interface ImagesResponse {
  images: Image[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FoldersResponse {
  folders: Folder[];
  totalFolders: number;
  totalImages: number;
}

export interface ImageResponse {
  id: string;
  path: string;
  url: string;
  metadata: ImageMetadata;
}

export interface RefreshResponse {
  message: string;
  imageCount: number;
  categoryCount: number;
}

export interface DaemonResponse {
  message: string;
}

export interface RebuildIndexResponse {
  message: string;
  entries: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  daemon: boolean;
}

export interface ErrorResponse {
  error: string;
}

// ============================================
// API Endpoint Definitions
// ============================================

export interface ApiEndpoints {
  // Category endpoints
  'GET /api/categories': {
    params: {};
    query: {};
    body: {};
    response: CategoriesResponse | ErrorResponse;
  };

  'GET /api/categories/:categoryPath/items': {
    params: CategoryPathParams;
    query: SearchQuery;
    body: {};
    response: CategoryItemsResponse | ErrorResponse;
  };

  // Item endpoints
  'GET /api/items/:categoryPath/:itemName/images': {
    params: ItemPathParams;
    query: PaginationQuery;
    body: {};
    response: ItemImagesResponse | ErrorResponse;
  };

  // Image endpoints
  'GET /api/images': {
    params: {};
    query: SearchQuery;
    body: {};
    response: ImagesResponse | ErrorResponse;
  };

  'GET /api/image/:id': {
    params: ImageIdParams;
    query: {};
    body: {};
    response: ImageResponse | ErrorResponse;
  };

  // Folder endpoints
  'GET /api/folders': {
    params: {};
    query: { search?: string };
    body: {};
    response: FoldersResponse | ErrorResponse;
  };

  // Cache endpoints
  'POST /api/refresh': {
    params: {};
    query: {};
    body: {};
    response: RefreshResponse | ErrorResponse;
  };

  // Daemon control endpoints
  'GET /api/daemon/status': {
    params: {};
    query: {};
    body: {};
    response: DaemonStatus | ErrorResponse;
  };

  'POST /api/daemon/start': {
    params: {};
    query: {};
    body: {};
    response: DaemonResponse | ErrorResponse;
  };

  'POST /api/daemon/stop': {
    params: {};
    query: {};
    body: {};
    response: DaemonResponse | ErrorResponse;
  };

  'POST /api/daemon/generate-all': {
    params: {};
    query: {};
    body: {};
    response: DaemonResponse | ErrorResponse;
  };

  'POST /api/daemon/rebuild-index': {
    params: {};
    query: {};
    body: {};
    response: RebuildIndexResponse | ErrorResponse;
  };

  'GET /api/daemon/index-stats': {
    params: {};
    query: {};
    body: {};
    response: IndexStats | ErrorResponse;
  };

  // Static endpoints
  'GET /': {
    params: {};
    query: {};
    body: {};
    response: string; // HTML file
  };

  'GET /health': {
    params: {};
    query: {};
    body: {};
    response: HealthResponse | ErrorResponse;
  };
}

// ============================================
// Handler Type Definitions
// ============================================

export type ApiHandler<T extends keyof ApiEndpoints> = (
  req: ApiRequest<
    ApiEndpoints[T]['params'],
    ApiEndpoints[T]['response'],
    ApiEndpoints[T]['body'],
    ApiEndpoints[T]['query']
  >,
  res: ExpressResponse<ApiEndpoints[T]['response']>
) => Promise<void> | void;

// ============================================
// Route Definitions with Handlers
// ============================================

export interface RouteDefinition<
  T extends keyof ApiEndpoints = keyof ApiEndpoints
> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: ApiHandler<T>;
  description: string;
}

// This will be populated with actual handlers when implementing
export const API_ROUTES: Record<string, RouteDefinition> = {
  // Category routes
  getCategories: {
    method: 'GET',
    path: '/api/categories',
    handler: null as any, // Will be implemented in separate handler files
    description: 'Get all categories with item and image counts',
  },

  getCategoryItems: {
    method: 'GET',
    path: '/api/categories/:categoryPath/items',
    handler: null as any,
    description: 'Get items for a specific category with pagination and search',
  },

  // Item routes
  getItemImages: {
    method: 'GET',
    path: '/api/items/:categoryPath/:itemName/images',
    handler: null as any,
    description: 'Get images for a specific item with pagination',
  },

  // Image routes
  getImages: {
    method: 'GET',
    path: '/api/images',
    handler: null as any,
    description: 'Get images with pagination and search (legacy support)',
  },

  getImage: {
    method: 'GET',
    path: '/api/image/:id',
    handler: null as any,
    description: 'Get single image metadata by base64 encoded path',
  },

  // Folder routes
  getFolders: {
    method: 'GET',
    path: '/api/folders',
    handler: null as any,
    description: 'Get images aggregated by folders',
  },

  // Cache routes
  refreshCache: {
    method: 'POST',
    path: '/api/refresh',
    handler: null as any,
    description: 'Refresh the image cache',
  },

  // Daemon routes
  getDaemonStatus: {
    method: 'GET',
    path: '/api/daemon/status',
    handler: null as any,
    description: 'Get thumbnail daemon status',
  },

  startDaemon: {
    method: 'POST',
    path: '/api/daemon/start',
    handler: null as any,
    description: 'Start the thumbnail daemon',
  },

  stopDaemon: {
    method: 'POST',
    path: '/api/daemon/stop',
    handler: null as any,
    description: 'Stop the thumbnail daemon',
  },

  generateAllThumbnails: {
    method: 'POST',
    path: '/api/daemon/generate-all',
    handler: null as any,
    description: 'Generate thumbnails for all images',
  },

  rebuildIndex: {
    method: 'POST',
    path: '/api/daemon/rebuild-index',
    handler: null as any,
    description: 'Rebuild the thumbnail index',
  },

  getIndexStats: {
    method: 'GET',
    path: '/api/daemon/index-stats',
    handler: null as any,
    description: 'Get thumbnail index statistics',
  },

  // Static routes
  serveHomePage: {
    method: 'GET',
    path: '/',
    handler: null as any,
    description: 'Serve the main gallery page',
  },

  healthCheck: {
    method: 'GET',
    path: '/health',
    handler: null as any,
    description: 'Health check endpoint for Docker and monitoring',
  },
};

// ============================================
// Utility Types
// ============================================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiPath = keyof ApiEndpoints;

export type ApiResponse<T extends ApiPath> = ApiEndpoints[T]['response'];

export type ApiParams<T extends ApiPath> = ApiEndpoints[T]['params'];

export type ApiQuery<T extends ApiPath> = ApiEndpoints[T]['query'];

export type ApiBody<T extends ApiPath> = ApiEndpoints[T]['body'];

// ============================================
// Constants
// ============================================

export const API_BASE_PATH = '/api';

export const SUPPORTED_IMAGE_FORMATS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.tiff',
] as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
} as const;

export const THUMBNAIL_SIZE = 300;

export const CACHE_TTL = 3600; // 1 hour in seconds

// ============================================
// Error Types
// ============================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
