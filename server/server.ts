/**
 * Gallant Gallery Server
 * TypeScript migration of the original server.js with full type safety
 */

import express = require('express');
import { Request, Response, NextFunction } from 'express';
import cors = require('cors');
import sharp = require('sharp');
import * as fs from 'fs-extra';
import * as path from 'path';
import NodeCache = require('node-cache');
import mime = require('mime-types');
import chokidar = require('chokidar');
import {
  ImageMetadata,
  Image,
  Category,
  CategoryItem,
  ItemImage,
  Folder,
  DaemonStatus,
  IndexStats,
  CategoriesResponse,
  CategoryItemsResponse,
  ItemImagesResponse,
  ImagesResponse,
  FoldersResponse,
  ImageResponse,
  RefreshResponse,
  DaemonResponse,
  RebuildIndexResponse,
  HealthResponse,
  ErrorResponse,
  ApiError,
  HTTP_STATUS,
  CategoryPathParams,
  ItemPathParams,
  ImageIdParams,
  PaginationQuery,
  SearchQuery,
} from './api-definitions';

// ============================================
// Type Definitions for Internal Use
// ============================================

interface ThumbnailIndexEntry {
  modTime: number;
  thumbnailPath: string;
  createdAt: number;
  metadata?: ImageMetadata;
  fileSize: number;
  updatedAt?: number;
}

interface ThumbnailIndex {
  [relativePath: string]: ThumbnailIndexEntry;
}

interface ImageFile {
  path: string;
  fullPath: string;
  directory: string;
}

interface CategoryData {
  name: string;
  path: string;
  fullPath: string;
}

interface ItemData {
  name: string;
  path: string;
  fullPath: string;
  category: string;
  images: ImageFile[];
  imageCount: number;
}

interface ThumbnailInfo {
  id: string;
  thumbnailPath: string;
}

// ============================================
// Server Configuration
// ============================================

const app = express();
const PORT: number = parseInt(process.env.PORT || '12512', 10);
const IMAGES_DIR: string = process.env.IMAGES_DIR || path.join(__dirname, '../images');
const CACHE_DIR: string = path.join(__dirname, '../cache');
const THUMBNAILS_DIR: string = path.join(CACHE_DIR, 'thumbnails');
const THUMBNAIL_INDEX_FILE: string = path.join(CACHE_DIR, 'thumbnail-index.json');

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// Thumbnail index to track modification times
let thumbnailIndex: ThumbnailIndex = {};

// Ensure directories exist
fs.ensureDirSync(CACHE_DIR);
fs.ensureDirSync(THUMBNAILS_DIR);
fs.ensureDirSync(IMAGES_DIR);

// ============================================
// Thumbnail Index Management
// ============================================

async function loadThumbnailIndex(): Promise<void> {
  try {
    if (await fs.pathExists(THUMBNAIL_INDEX_FILE)) {
      const data = await fs.readJson(THUMBNAIL_INDEX_FILE);
      thumbnailIndex = data || {};
      console.log(
        `Loaded thumbnail index with ${
          Object.keys(thumbnailIndex).length
        } entries`
      );
    } else {
      thumbnailIndex = {};
      console.log('No existing thumbnail index found, starting fresh');
    }
  } catch (error) {
    console.error('Error loading thumbnail index:', error);
    thumbnailIndex = {};
  }
}

async function saveThumbnailIndex(): Promise<void> {
  try {
    await fs.writeJson(THUMBNAIL_INDEX_FILE, thumbnailIndex, { spaces: 2 });
  } catch (error) {
    console.error('Error saving thumbnail index:', error);
  }
}

async function isImageUpToDate(imagePath: string, thumbnailPath: string): Promise<boolean> {
  try {
    // Check if thumbnail file exists
    if (!(await fs.pathExists(thumbnailPath))) {
      return false;
    }

    // Get image modification time and size
    const imageStats = await fs.stat(imagePath);
    const imageModTime = imageStats.mtime.getTime();
    const imageSize = imageStats.size;

    // Get relative path for index key
    const relativePath = path
      .relative(IMAGES_DIR, imagePath)
      .replace(/\\/g, '/');

    // Check if we have index entry and if modification time and size match
    const indexEntry = thumbnailIndex[relativePath];
    if (
      !indexEntry ||
      indexEntry.modTime !== imageModTime ||
      indexEntry.fileSize !== imageSize
    ) {
      return false;
    }

    // Additional check: verify thumbnail file still exists and has reasonable size
    const thumbnailStats = await fs.stat(thumbnailPath);
    if (thumbnailStats.size < 1000) {
      // Thumbnail should be at least 1KB
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function updateThumbnailIndex(
  imagePath: string, 
  thumbnailPath: string, 
  metadata: ImageMetadata | null = null
): Promise<void> {
  try {
    const imageStats = await fs.stat(imagePath);
    const relativePath = path
      .relative(IMAGES_DIR, imagePath)
      .replace(/\\/g, '/');

    // Get metadata if not provided
    if (!metadata) {
      metadata = await getImageMetadataInternal(imagePath);
    }

    thumbnailIndex[relativePath] = {
      modTime: imageStats.mtime.getTime(),
      thumbnailPath: path.basename(thumbnailPath),
      createdAt: Date.now(),
      metadata: metadata || undefined,
      fileSize: imageStats.size,
    };

    // Save index periodically (every 10 updates) or when forced
    if (Object.keys(thumbnailIndex).length % 10 === 0) {
      await saveThumbnailIndex();
    }
  } catch (error) {
    console.error('Error updating thumbnail index:', error);
  }
}

async function removeFromThumbnailIndex(imagePath: string): Promise<void> {
  try {
    const relativePath = path
      .relative(IMAGES_DIR, imagePath)
      .replace(/\\/g, '/');
    delete thumbnailIndex[relativePath];
    await saveThumbnailIndex();
  } catch (error) {
    console.error('Error removing from thumbnail index:', error);
  }
}

// ============================================
// Middleware
// ============================================

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Thumbnail serving middleware
app.use('/thumbnails/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const exts = ['.webp', '.jpg', '.png'];
  
  for (const ext of exts) {
    const filePath = path.join(THUMBNAILS_DIR, id + ext);
    if (await fs.pathExists(filePath)) {
      res.type(ext);
      return res.sendFile(path.resolve(filePath));
    }
  }
  
  res.status(404).send('Thumbnail not found');
});

app.use('/images', express.static(IMAGES_DIR));

// ============================================
// Utility Functions
// ============================================

// Supported image formats
const supportedFormats: readonly string[] = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.tiff',
];

// Check if file is an image
function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return supportedFormats.includes(ext);
}

// Utility function to get thumbnailId and thumbnailPath from image path
function getThumbnailInfo(imagePath: string | ImageFile): ThumbnailInfo {
  const relativePath = typeof imagePath === 'object' && 'path' in imagePath
    ? imagePath.path
    : imagePath as string;
    
  let id = Buffer.from(relativePath).toString('base64');

  if (id.includes('/')) {
    id = id.replace(/\//g, '_'); // Replace slashes to make valid filename
  }

  const thumbnailPath = path.join(THUMBNAILS_DIR, id + '.jpg');
  return { id, thumbnailPath };
}

// ============================================
// Image Processing Functions
// ============================================

// Generate thumbnail with lazy loading
async function generateThumbnail(
  imagePath: string,
  thumbnailPath: string,
  size: number = 300,
  force: boolean = false
): Promise<boolean> {
  const timeStart = Date.now();

  try {
    // Check if thumbnail is up to date (unless forced)
    if (!force && (await isImageUpToDate(imagePath, thumbnailPath))) {
      console.log(
        `Skipped thumbnail for ${path.basename(imagePath)} (up to date)`
      );
      return true;
    }

    console.log(`Generating thumbnail for ${path.basename(imagePath)}...`);

    await sharp(imagePath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Get metadata and update the thumbnail index
    const metadata = await getImageMetadataInternal(imagePath);
    await updateThumbnailIndex(imagePath, thumbnailPath, metadata);

    console.log(
      `Generated thumbnail for ${path.basename(imagePath)} in ${
        Date.now() - timeStart
      }ms`
    );
    return true;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return false;
  }
}

// Internal function to read metadata from file (always reads from disk)
async function getImageMetadataInternal(imagePath: string): Promise<ImageMetadata | null> {
  try {
    const stats = await fs.stat(imagePath);

    // Use Sharp to get image dimensions and metadata
    let width: number | null = null;
    let height: number | null = null;
    let format: string;
    
    try {
      const metadata = await sharp(imagePath).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
      format = metadata.format || path.extname(imagePath).slice(1).toLowerCase();
    } catch (e) {
      // Fallback if Sharp can't read the image
      format = path.extname(imagePath).slice(1).toLowerCase();
    }

    return {
      filename: path.basename(imagePath),
      size: stats.size,
      width,
      height,
      format,
      lastModified: stats.mtime,
    };
  } catch (error) {
    console.error('Error getting metadata:', error);
    return null;
  }
}

// Get image metadata with caching
async function getImageMetadata(imagePath: string): Promise<ImageMetadata | null> {
  try {
    const stats = await fs.stat(imagePath);
    const relativePath = path
      .relative(IMAGES_DIR, imagePath)
      .replace(/\\/g, '/');

    // Check if we have cached metadata in the thumbnail index
    const indexEntry = thumbnailIndex[relativePath];
    if (
      indexEntry &&
      indexEntry.modTime === stats.mtime.getTime() &&
      indexEntry.fileSize === stats.size &&
      indexEntry.metadata
    ) {
      // Return cached metadata
      return indexEntry.metadata;
    }

    // Read metadata from file and update cache
    const metadata = await getImageMetadataInternal(imagePath);

    // Update the index with new metadata (but don't save immediately)
    if (metadata) {
      thumbnailIndex[relativePath] = {
        ...(indexEntry || {}),
        modTime: stats.mtime.getTime(),
        fileSize: stats.size,
        metadata: metadata,
        updatedAt: Date.now(),
        thumbnailPath: indexEntry?.thumbnailPath || '',
        createdAt: indexEntry?.createdAt || Date.now(),
      };
    }

    return metadata;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return await getImageMetadataInternal(imagePath); // Fallback to direct read
  }
}

// ============================================
// Directory Scanning Functions
// ============================================

// Recursively scan directory for images with category structure
async function scanImagesDirectory(dirPath: string, relativePath: string = ''): Promise<ImageFile[]> {
  const images: ImageFile[] = [];

  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        // Recursively scan subdirectories
        const subImages = await scanImagesDirectory(fullPath, relativeItemPath);
        images.push(...subImages);
      } else if (stats.isFile() && isImageFile(item)) {
        images.push({
          path: relativeItemPath.replace(/\\/g, '/'), // Normalize path separators
          fullPath: fullPath,
          directory: relativePath || '/',
        });
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
  }

  return images;
}

// Scan for categories (immediate subfolders of IMAGES_DIR)
async function scanCategories(): Promise<CategoryData[]> {
  const categories: CategoryData[] = [];

  try {
    const items = await fs.readdir(IMAGES_DIR);

    for (const item of items) {
      const fullPath = path.join(IMAGES_DIR, item);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        categories.push({
          name: item,
          path: item,
          fullPath: fullPath,
        });
      }
    }
  } catch (error) {
    console.error('Error scanning categories:', error);
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

// Scan for items within a category (subfolders of category)
async function scanCategoryItems(categoryPath: string): Promise<ItemData[]> {
  const items: ItemData[] = [];

  try {
    const fullCategoryPath = path.join(IMAGES_DIR, categoryPath);
    const itemNames = await fs.readdir(fullCategoryPath);

    for (const itemName of itemNames) {
      const itemFullPath = path.join(fullCategoryPath, itemName);
      const stats = await fs.stat(itemFullPath);

      if (stats.isDirectory()) {
        // Scan for images in this item folder
        const itemRelativePath = path.join(categoryPath, itemName);
        const images = await scanImagesDirectory(itemFullPath, itemRelativePath);

        if (images.length > 0) {
          items.push({
            name: itemName,
            path: itemRelativePath.replace(/\\/g, '/'),
            fullPath: itemFullPath,
            category: categoryPath,
            images: images,
            imageCount: images.length,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning category items:', error);
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================
// Cached Data Functions
// ============================================

// Get all images with caching
async function getAllImages(): Promise<ImageFile[]> {
  const cacheKey = 'all_images';
  let images = cache.get<ImageFile[]>(cacheKey);

  if (!images) {
    console.log('Scanning images directory...');
    images = await scanImagesDirectory(IMAGES_DIR);
    cache.set(cacheKey, images);
    console.log(`Found ${images.length} images`);
  }

  return images;
}

// Get all categories with caching
async function getAllCategories(): Promise<CategoryData[]> {
  const cacheKey = 'all_categories';
  let categories = cache.get<CategoryData[]>(cacheKey);

  if (!categories) {
    console.log('Scanning categories...');
    categories = await scanCategories();
    cache.set(cacheKey, categories);
    console.log(`Found ${categories.length} categories`);
  }

  return categories;
}

// Get items for a specific category with caching
async function getCategoryItems(categoryPath: string): Promise<ItemData[]> {
  const cacheKey = `category_items_${categoryPath}`;
  let items = cache.get<ItemData[]>(cacheKey);

  if (!items) {
    console.log(`Scanning items for category: ${categoryPath}`);
    items = await scanCategoryItems(categoryPath);
    cache.set(cacheKey, items);
    console.log(`Found ${items.length} items in category ${categoryPath}`);
  }

  return items;
}

// ============================================
// Thumbnail Daemon Class
// ============================================

class ThumbnailDaemon {
  private watcher: chokidar.FSWatcher | null = null;
  private processingQueue = new Set<string>();
  private isWatching = false;

  start(): void {
    if (this.isWatching) {
      console.log('Thumbnail daemon is already running');
      return;
    }

    console.log(
      `Starting thumbnail daemon for directory: ${path.resolve(IMAGES_DIR)}`
    );

    // Watch for new files in the images directory
    this.watcher = chokidar.watch(IMAGES_DIR, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false, // Process existing files on startup
      depth: undefined, // Watch all subdirectories
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', async (filePath: string) => {
        if (this.isImageFile(filePath)) {
          await this.processNewImage(filePath, 'added');
        }
      })
      .on('change', async (filePath: string) => {
        if (this.isImageFile(filePath)) {
          await this.processNewImage(filePath, 'changed');
        }
      })
      .on('unlink', async (filePath: string) => {
        if (this.isImageFile(filePath)) {
          await this.handleImageDeletion(filePath);
        }
      })
      .on('ready', () => {
        console.log('Thumbnail daemon is ready and watching for changes');
        this.isWatching = true;
      })
      .on('error', (error) => {
        console.error('Thumbnail daemon error:', error);
      });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.isWatching = false;
      console.log('Thumbnail daemon stopped');
    }
  }

  private isImageFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return supportedFormats.includes(ext);
  }

  private async processNewImage(filePath: string, action: 'added' | 'changed'): Promise<void> {
    const relativePath = path.relative(IMAGES_DIR, filePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');

    // Prevent duplicate processing
    if (this.processingQueue.has(normalizedPath)) {
      return;
    }

    this.processingQueue.add(normalizedPath);

    try {
      console.log(`📸 Image ${action}: ${normalizedPath}`);

      // Generate thumbnail
      const { id: thumbnailId, thumbnailPath } = getThumbnailInfo(normalizedPath);

      // Force regeneration if the image was changed, otherwise use lazy loading
      const forceRegenerate = action === 'changed';
      const success = await generateThumbnail(
        filePath,
        thumbnailPath,
        300,
        forceRegenerate
      );

      if (success) {
        console.log(`✅ Thumbnail processed for: ${normalizedPath}`);

        // Clear cache to force refresh on next request
        cache.del('all_images');
        cache.del('all_categories');
        // Clear category-specific caches
        const pathParts = relativePath.split(path.sep);
        if (pathParts.length >= 1) {
          cache.del(`category_items_${pathParts[0]}`);
        }
        console.log('🔄 Image cache cleared');
      } else {
        console.log(`❌ Failed to generate thumbnail for: ${normalizedPath}`);
      }
    } catch (error) {
      console.error(`Error processing image ${normalizedPath}:`, error);
    } finally {
      this.processingQueue.delete(normalizedPath);
    }
  }

  private async handleImageDeletion(filePath: string): Promise<void> {
    const relativePath = path.relative(IMAGES_DIR, filePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');

    try {
      console.log(`🗑️ Image deleted: ${normalizedPath}`);

      // Remove corresponding thumbnail
      const { thumbnailPath } = getThumbnailInfo(normalizedPath);

      if (await fs.pathExists(thumbnailPath)) {
        await fs.remove(thumbnailPath);
        console.log(`🗑️ Thumbnail removed for: ${normalizedPath}`);
      }

      // Remove from thumbnail index
      await removeFromThumbnailIndex(filePath);
      console.log(`🗑️ Removed from thumbnail index: ${normalizedPath}`);

      // Clear cache to force refresh
      cache.del('all_images');
      cache.del('all_categories');
      // Clear category-specific caches
      const pathParts = normalizedPath.split('/');
      if (pathParts.length >= 1) {
        cache.del(`category_items_${pathParts[0]}`);
      }
      console.log('🔄 Image cache cleared');
    } catch (error) {
      console.error(`Error handling deletion of ${normalizedPath}:`, error);
    }
  }

  // Generate thumbnails for all existing images (useful for initial setup)
  async generateAllThumbnails(): Promise<void> {
    console.log('🚀 Starting bulk thumbnail generation...');
    const images = await scanImagesDirectory(IMAGES_DIR);

    let processed = 0;
    let skipped = 0;

    for (const img of images) {
      const { thumbnailPath } = getThumbnailInfo(img);

      // Use lazy loading - only generate if not up to date
      const isUpToDate = await isImageUpToDate(img.fullPath, thumbnailPath);
      if (isUpToDate) {
        skipped++;
        continue;
      }

      const success = await generateThumbnail(img.fullPath, thumbnailPath);
      if (success) {
        processed++;
        if (processed % 10 === 0) {
          console.log(`📸 Generated ${processed} thumbnails...`);
        }
      }
    }

    // Save index after bulk generation
    await saveThumbnailIndex();

    console.log(
      `✅ Bulk thumbnail generation complete: ${processed} generated, ${skipped} skipped`
    );
  }

  getStatus(): DaemonStatus {
    const indexEntries = Object.keys(thumbnailIndex).length;
    const entriesWithMetadata = Object.values(thumbnailIndex).filter(
      (entry) => entry.metadata
    ).length;

    return {
      isWatching: this.isWatching,
      processingQueue: Array.from(this.processingQueue),
      watchedDirectory: path.resolve(IMAGES_DIR),
      thumbnailIndex: {
        totalEntries: indexEntries,
        entriesWithMetadata: entriesWithMetadata,
        indexFile: THUMBNAIL_INDEX_FILE,
        cacheHitRate:
          indexEntries > 0
            ? Math.round((entriesWithMetadata / indexEntries) * 100)
            : 0,
      },
    };
  }
}

// Initialize thumbnail daemon
const thumbnailDaemon = new ThumbnailDaemon();

// ============================================
// API Route Handlers
// ============================================

// Get all categories
app.get('/api/categories', async (req: Request, res: Response<CategoriesResponse | ErrorResponse>) => {
  try {
    const categories = await getAllCategories();
    
    // Get item count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const items = await getCategoryItems(category.path);
        const totalImages = items.reduce((sum, item) => sum + item.imageCount, 0);
        
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
});

// Get items for a specific category
app.get('/api/categories/:categoryPath/items', async (
  req: Request<CategoryPathParams, CategoryItemsResponse | ErrorResponse, {}, SearchQuery>, 
  res: Response<CategoryItemsResponse | ErrorResponse>
) => {
  try {
    const categoryPath = decodeURIComponent(req.params.categoryPath);
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const search = req.query.search || '';

    const items = await getCategoryItems(categoryPath);

    // Filter by search term if provided
    let filteredItems = items;
    if (search) {
      filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // Generate thumbnails and metadata for items
    const itemsWithThumbnails = await Promise.all(
      paginatedItems.map(async (item) => {
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
            metadata: metadata!,
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
});

// Get images for a specific item
app.get('/api/items/:categoryPath/:itemName/images', async (
  req: Request<ItemPathParams, ItemImagesResponse | ErrorResponse, {}, PaginationQuery>,
  res: Response<ItemImagesResponse | ErrorResponse>
) => {
  try {
    const categoryPath = decodeURIComponent(req.params.categoryPath);
    const itemName = decodeURIComponent(req.params.itemName);
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);

    const items = await getCategoryItems(categoryPath);
    const item = items.find(i => i.name === itemName);

    if (!item) {
      const errorResponse: ErrorResponse = { error: 'Item not found' };
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = item.images.slice(startIndex, endIndex);

    // Generate thumbnails and metadata for images
    const imagesWithThumbnails = await Promise.all(
      paginatedImages.map(async (img) => {
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
          metadata: metadata!,
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
});

// Get images with pagination and search and folder filtering (legacy support)
app.get('/api/images', async (
  req: Request<{}, ImagesResponse | ErrorResponse, {}, SearchQuery>,
  res: Response<ImagesResponse | ErrorResponse>
) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const search = req.query.search || '';

    let searchObj: Record<string, string> = {};
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
        .filter((img) => {
          if (searchObj.dir) {
            return img.path.includes(searchObj.dir);
          }
          return true;
        })
        .filter((img) => {
          if (searchObj.keyword)
            return img.path
              .toLowerCase()
              .includes(searchObj.keyword.toLowerCase());
          return true;
        });
    }

    // Sort by path
    images.sort((a, b) => a.path.localeCompare(b.path));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = images.slice(startIndex, endIndex);

    const timeStart = Date.now();
    // Generate thumbnails and get metadata for requested images
    const imageData = await Promise.all(
      paginatedImages.map(async (img) => {
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
          metadata: metadata!,
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
});

// Get images aggregated by folders
app.get('/api/folders', async (
  req: Request<{}, FoldersResponse | ErrorResponse, {}, { search?: string }>,
  res: Response<FoldersResponse | ErrorResponse>
) => {
  try {
    const search = req.query.search || '';

    let images = await getAllImages();

    // Filter by search term if provided
    if (search) {
      images = images.filter(
        (img) =>
          img.path.toLowerCase().includes(search.toLowerCase()) ||
          img.directory.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Group images by directory
    const folderGroups: Record<string, {
      directory: string;
      displayName: string;
      fullPath: string;
      images: ImageFile[];
      totalCount: number;
    }> = {};

    images.forEach((img) => {
      const folderKey = img.directory || '/';
      if (!folderGroups[folderKey]) {
        folderGroups[folderKey] = {
          directory: folderKey,
          displayName:
            folderKey === '/'
              ? 'Root'
              : folderKey.split('/').pop() || folderKey,
          fullPath: folderKey,
          images: [],
          totalCount: 0,
        };
      }
      folderGroups[folderKey].images.push(img);
      folderGroups[folderKey].totalCount++;
    });

    // Convert to array and sort by directory name
    const folders = Object.values(folderGroups).sort((a, b) =>
      a.directory.localeCompare(b.directory)
    );

    // Process each folder to get thumbnail data
    const folderData = await Promise.all(
      folders.map(async (folder) => {
        // Sort images within folder - prioritize "main" or "封面" files first
        folder.images.sort((a, b) => {
          const aName = path
            .basename(a.path, path.extname(a.path))
            .toLowerCase();
          const bName = path
            .basename(b.path, path.extname(b.path))
            .toLowerCase();

          // Check if either file is a main/cover image
          const aIsMain = aName === 'main' || aName === '封面';
          const bIsMain = bName === 'main' || bName === '封面';

          if (aIsMain && !bIsMain) return -1;
          if (!aIsMain && bIsMain) return 1;

          // If both or neither are main images, sort alphabetically
          return a.path.localeCompare(b.path);
        });

        // Get main image (first image) and up to 5 additional images
        const mainImage = folder.images[0];
        const additionalImages = folder.images.slice(1, 6); // Up to 5 more

        // Generate thumbnail data for main image
        const { thumbnailPath: mainThumbnailPath, id: mainThumbnailId } =
          getThumbnailInfo(mainImage.path);

        // Ensure main thumbnail exists
        const isUpToDate = await isImageUpToDate(
          mainImage.fullPath,
          mainThumbnailPath
        );
        if (!isUpToDate) {
          await generateThumbnail(mainImage.fullPath, mainThumbnailPath);
        }

        const mainMetadata = await getImageMetadata(mainImage.fullPath);

        // Generate thumbnail data for additional images
        const additionalThumbnails = await Promise.all(
          additionalImages.map(async (img) => {
            const { thumbnailPath, id: thumbnailId } = getThumbnailInfo(img.path);

            // Ensure thumbnail exists
            const isUpToDate = await isImageUpToDate(
              img.fullPath,
              thumbnailPath
            );
            if (!isUpToDate) {
              await generateThumbnail(img.fullPath, thumbnailPath);
            }

            return {
              id: thumbnailId,
              path: img.path,
              thumbnail: `/thumbnails/${thumbnailId}`,
              filename: path.basename(img.path),
            };
          })
        );

        return {
          directory: folder.directory,
          displayName: folder.displayName,
          totalCount: folder.totalCount,
          mainImage: {
            id: mainThumbnailId,
            path: mainImage.path,
            thumbnail: `/thumbnails/${mainThumbnailId}`,
            metadata: mainMetadata!,
          },
          additionalImages: additionalThumbnails,
          hasMore: folder.totalCount > 6,
        };
      })
    );

    const response: FoldersResponse = {
      folders: folderData,
      totalFolders: folderData.length,
      totalImages: images.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching folder data:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// Get single image metadata
app.get('/api/image/:id', async (
  req: Request<ImageIdParams, ImageResponse | ErrorResponse>,
  res: Response<ImageResponse | ErrorResponse>
) => {
  try {
    const imagePath = Buffer.from(req.params.id, 'base64').toString();
    const fullPath = path.join(IMAGES_DIR, imagePath);

    if (!(await fs.pathExists(fullPath))) {
      const errorResponse: ErrorResponse = { error: 'Image not found' };
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }

    const metadata = await getImageMetadata(fullPath);

    const response: ImageResponse = {
      id: req.params.id,
      path: imagePath,
      url: `/images/${imagePath}`,
      metadata: metadata!,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching image:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// Refresh cache
app.post('/api/refresh', async (
  req: Request<{}, RefreshResponse | ErrorResponse>,
  res: Response<RefreshResponse | ErrorResponse>
) => {
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
});

// Daemon control routes
app.get('/api/daemon/status', (
  req: Request<{}, DaemonStatus | ErrorResponse>,
  res: Response<DaemonStatus | ErrorResponse>
) => {
  try {
    const status = thumbnailDaemon.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting daemon status:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

app.post('/api/daemon/start', (
  req: Request<{}, DaemonResponse | ErrorResponse>,
  res: Response<DaemonResponse | ErrorResponse>
) => {
  try {
    thumbnailDaemon.start();
    const response: DaemonResponse = { message: 'Thumbnail daemon started' };
    res.json(response);
  } catch (error) {
    console.error('Error starting daemon:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to start daemon' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

app.post('/api/daemon/stop', (
  req: Request<{}, DaemonResponse | ErrorResponse>,
  res: Response<DaemonResponse | ErrorResponse>
) => {
  try {
    thumbnailDaemon.stop();
    const response: DaemonResponse = { message: 'Thumbnail daemon stopped' };
    res.json(response);
  } catch (error) {
    console.error('Error stopping daemon:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to stop daemon' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

app.post('/api/daemon/generate-all', async (
  req: Request<{}, DaemonResponse | ErrorResponse>,
  res: Response<DaemonResponse | ErrorResponse>
) => {
  try {
    // Run in background to avoid request timeout
    thumbnailDaemon.generateAllThumbnails().catch((error) => {
      console.error('Error in bulk thumbnail generation:', error);
    });
    const response: DaemonResponse = { message: 'Bulk thumbnail generation started' };
    res.json(response);
  } catch (error) {
    console.error('Error starting bulk generation:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to start bulk generation' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

app.post('/api/daemon/rebuild-index', async (
  req: Request<{}, RebuildIndexResponse | ErrorResponse>,
  res: Response<RebuildIndexResponse | ErrorResponse>
) => {
  try {
    console.log('🔧 Rebuilding thumbnail index...');

    // Clear current index
    thumbnailIndex = {};

    // Scan thumbnails directory and rebuild index
    const images = await scanImagesDirectory(IMAGES_DIR);
    let rebuilt = 0;

    for (const img of images) {
      const { thumbnailPath } = getThumbnailInfo(img.path);

      if (await fs.pathExists(thumbnailPath)) {
        // Get metadata for the image
        const metadata = await getImageMetadataInternal(img.fullPath);
        await updateThumbnailIndex(img.fullPath, thumbnailPath, metadata);
        rebuilt++;

        if (rebuilt % 50 === 0) {
          console.log(`🔧 Rebuilt ${rebuilt} index entries...`);
        }
      }
    }

    await saveThumbnailIndex();
    console.log(`✅ Thumbnail index rebuilt with ${rebuilt} entries`);

    const response: RebuildIndexResponse = {
      message: 'Thumbnail index rebuilt successfully',
      entries: rebuilt,
    };

    res.json(response);
  } catch (error) {
    console.error('Error rebuilding index:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to rebuild index' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// Get thumbnail index statistics
app.get('/api/daemon/index-stats', (
  req: Request<{}, IndexStats | ErrorResponse>,
  res: Response<IndexStats | ErrorResponse>
) => {
  try {
    const entries = Object.values(thumbnailIndex);
    const stats: IndexStats = {
      totalEntries: entries.length,
      entriesWithMetadata: entries.filter((entry) => entry.metadata).length,
      entriesWithThumbnails: entries.filter((entry) => entry.thumbnailPath).length,
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((e) => e.createdAt || 0))
          : null,
      newestEntry:
        entries.length > 0
          ? Math.max(...entries.map((e) => e.updatedAt || e.createdAt || 0))
          : null,
      indexFile: THUMBNAIL_INDEX_FILE,
      indexSize: JSON.stringify(thumbnailIndex).length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting index stats:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// Serve main page
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Health check endpoint for Docker
app.get('/health', (
  req: Request<{}, HealthResponse | ErrorResponse>,
  res: Response<HealthResponse | ErrorResponse>
) => {
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
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req: Request, res: Response) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/images') || req.path.startsWith('/thumbnails')) {
      const errorResponse: ErrorResponse = { error: 'API endpoint not found' };
      return res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
    }
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// ============================================
// Error Handling Middleware
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    const errorResponse: ErrorResponse = { error: err.message };
    return res.status(err.statusCode).json(errorResponse);
  }

  console.error('Unhandled error:', err);
  const errorResponse: ErrorResponse = { error: 'Internal server error' };
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
});

// ============================================
// Server Startup
// ============================================

// Start server
app.listen(PORT, async () => {
  console.log(`Gallery server running on http://localhost:${PORT}`);
  console.log(`Images directory: ${path.resolve(IMAGES_DIR)}`);
  console.log(`Thumbnails directory: ${path.resolve(THUMBNAILS_DIR)}`);

  // Load thumbnail index
  await loadThumbnailIndex();

  // Start the thumbnail daemon
  thumbnailDaemon.start();

  // Optionally generate thumbnails for existing images on startup
  if (process.env.GENERATE_THUMBNAILS_ON_START !== 'false') {
    console.log('Generating thumbnails for existing images...');
    setTimeout(() => {
      thumbnailDaemon.generateAllThumbnails().catch((error) => {
        console.error('Error in startup thumbnail generation:', error);
      });
    }, 2000); // Delay to let the watcher initialize
  }
});

// ============================================
// Graceful Shutdown
// ============================================

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  thumbnailDaemon.stop();
  await saveThumbnailIndex();
  console.log('💾 Thumbnail index saved');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  thumbnailDaemon.stop();
  await saveThumbnailIndex();
  console.log('💾 Thumbnail index saved');
  process.exit(0);
});

export default app;
