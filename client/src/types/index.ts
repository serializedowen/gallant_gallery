export interface Image {
  id: string;
  path: string;
  thumbnailPath: string;
  name: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  directory: string;
  modifiedTime: string;
}

export interface Folder {
  name: string;
  path: string;
  imageCount: number;
  thumbnail?: string;
}

export interface Category {
  name: string;
  items: CategoryItem[];
  imageCount: number;
  totalItems: number;
}

export interface CategoryItem {
  name: string;
  path: string;
  type: 'folder' | 'image';
  imageCount?: number;
  thumbnail?: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  format?: string;
  modifiedTime?: string;
}

export interface DaemonStatus {
  isRunning: boolean;
  isWatching: boolean;
  directory: string;
  watchedDirectory: string;
  queueLength: number;
  processingQueue: string[];
  indexEntries: number;
  metadataCache: number;
  thumbnailIndexCount: number;
  thumbnailIndex?: {
    totalEntries: number;
    entriesWithMetadata: number;
    cacheHitRate: string;
  };
}

export type ViewType = 'categories' | 'folders' | 'grid';
export type Language = 'zh' | 'en';

export interface SearchParams {
  term: string;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  hasMore?: boolean;
  total?: number;
}
