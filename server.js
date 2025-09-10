const express = require('express');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const NodeCache = require('node-cache');
const mime = require('mime-types');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.PORT || 3000;
const IMAGES_DIR = process.env.IMAGES_DIR || './images';
const CACHE_DIR = './cache';
const THUMBNAILS_DIR = path.join(CACHE_DIR, 'thumbnails');
const THUMBNAIL_INDEX_FILE = path.join(CACHE_DIR, 'thumbnail-index.json');

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// Thumbnail index to track modification times
let thumbnailIndex = {};

// Ensure directories exist
fs.ensureDirSync(CACHE_DIR);
fs.ensureDirSync(THUMBNAILS_DIR);
fs.ensureDirSync(IMAGES_DIR);

// Thumbnail index management
async function loadThumbnailIndex() {
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

async function saveThumbnailIndex() {
  try {
    await fs.writeJson(THUMBNAIL_INDEX_FILE, thumbnailIndex, { spaces: 2 });
  } catch (error) {
    console.error('Error saving thumbnail index:', error);
  }
}

async function isImageUpToDate(imagePath, thumbnailPath) {
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

async function updateThumbnailIndex(imagePath, thumbnailPath, metadata = null) {
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
      metadata: metadata, // Cache the metadata
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

async function removeFromThumbnailIndex(imagePath) {
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

// Middleware
app.use(express.static('public'));
app.use('/thumbnails/:id', async (req, res, next) => {
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

// Supported image formats
const supportedFormats = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.tiff',
];

// Check if file is an image
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return supportedFormats.includes(ext);
}

// Generate thumbnail with lazy loading
async function generateThumbnail(
  imagePath,
  thumbnailPath,
  size = 300,
  force = false
) {
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
async function getImageMetadataInternal(imagePath) {
  try {
    const stats = await fs.stat(imagePath);

    // Use Sharp to get image dimensions and metadata
    let width, height, format;
    try {
      const metadata = await sharp(imagePath).metadata();
      width = metadata.width;
      height = metadata.height;
      format = metadata.format;
    } catch (e) {
      // Fallback if Sharp can't read the image
      width = null;
      height = null;
      format = path.extname(imagePath).slice(1).toLowerCase();
    }

    return {
      filename: path.basename(imagePath),
      size: stats.size,
      width: width,
      height: height,
      format: format,
      lastModified: stats.mtime,
    };
  } catch (error) {
    console.error('Error getting metadata:', error);
    return null;
  }
}

// Get image metadata with caching
async function getImageMetadata(imagePath) {
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
      };
    }

    return metadata;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return await getImageMetadataInternal(imagePath); // Fallback to direct read
  }
}

// Recursively scan directory for images with category structure
async function scanImagesDirectory(dirPath, relativePath = '') {
  const images = [];

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
async function scanCategories() {
  const categories = [];

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
async function scanCategoryItems(categoryPath) {
  const items = [];

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

// Get all images with caching
async function getAllImages() {
  const cacheKey = 'all_images';
  let images = cache.get(cacheKey);

  if (!images) {
    console.log('Scanning images directory...');
    images = await scanImagesDirectory(IMAGES_DIR);
    cache.set(cacheKey, images);
    console.log(`Found ${images.length} images`);
  }

  return images;
}

// Get all categories with caching
async function getAllCategories() {
  const cacheKey = 'all_categories';
  let categories = cache.get(cacheKey);

  if (!categories) {
    console.log('Scanning categories...');
    categories = await scanCategories();
    cache.set(cacheKey, categories);
    console.log(`Found ${categories.length} categories`);
  }

  return categories;
}

// Get items for a specific category with caching
async function getCategoryItems(categoryPath) {
  const cacheKey = `category_items_${categoryPath}`;
  let items = cache.get(cacheKey);

  if (!items) {
    console.log(`Scanning items for category: ${categoryPath}`);
    items = await scanCategoryItems(categoryPath);
    cache.set(cacheKey, items);
    console.log(`Found ${items.length} items in category ${categoryPath}`);
  }

  return items;
}

// File watcher daemon for automatic thumbnail generation
class ThumbnailDaemon {
  constructor() {
    this.watcher = null;
    this.processingQueue = new Set();
    this.isWatching = false;
  }

  start() {
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
      .on('add', async (filePath) => {
        if (this.isImageFile(filePath)) {
          await this.processNewImage(filePath, 'added');
        }
      })
      .on('change', async (filePath) => {
        if (this.isImageFile(filePath)) {
          await this.processNewImage(filePath, 'changed');
        }
      })
      .on('unlink', async (filePath) => {
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

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.isWatching = false;
      console.log('Thumbnail daemon stopped');
    }
  }

  isImageFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return supportedFormats.includes(ext);
  }

  async processNewImage(filePath, action) {
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
      const { id: thumbnailId, thumbnailPath } =
        getThumbnailInfo(normalizedPath);

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
        const relativePath = path.relative(IMAGES_DIR, filePath);
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

  async handleImageDeletion(filePath) {
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
  async generateAllThumbnails() {
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

  getStatus() {
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

// Utility function to get thumbnailId and thumbnailPath from image path
function getThumbnailInfo(imagePath) {
  const relativePath =
    typeof imagePath === 'object' && imagePath.path
      ? imagePath.path
      : imagePath;
  let id = Buffer.from(relativePath).toString('base64');

  if (id.includes('/')) {
    id = id.replace(/\//g, '_'); // Replace slashes to make valid filename
  }

  const thumbnailPath = path.join(THUMBNAILS_DIR, id + '.jpg');
  return { id, thumbnailPath };
}

// Initialize thumbnail daemon
const thumbnailDaemon = new ThumbnailDaemon();

// API Routes

// Get all categories
app.get('/api/categories', async (req, res) => {
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

    res.json({
      categories: categoriesWithCounts,
      totalCategories: categoriesWithCounts.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get items for a specific category
app.get('/api/categories/:categoryPath/items', async (req, res) => {
  try {
    const categoryPath = decodeURIComponent(req.params.categoryPath);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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
            metadata: metadata,
          },
        };
      })
    );

    res.json({
      items: itemsWithThumbnails,
      totalCount: filteredItems.length,
      page,
      limit,
      hasMore: endIndex < filteredItems.length,
      category: categoryPath,
    });
  } catch (error) {
    console.error('Error fetching category items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get images for a specific item
app.get('/api/items/:categoryPath/:itemName/images', async (req, res) => {
  try {
    const categoryPath = decodeURIComponent(req.params.categoryPath);
    const itemName = decodeURIComponent(req.params.itemName);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const items = await getCategoryItems(categoryPath);
    const item = items.find(i => i.name === itemName);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
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
          metadata: metadata,
        };
      })
    );

    res.json({
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
    });
  } catch (error) {
    console.error('Error fetching item images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get images with pagination and search and folder filtering (legacy support)
app.get('/api/images', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    let searchObj = {};
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
          metadata: metadata,
        };
      })
    );

    console.log(
      `Processed ${imageData.length} images in ${Date.now() - timeStart}ms`
    );

    res.json({
      images: imageData,
      totalCount: images.length,
      page,
      limit,
      hasMore: endIndex < images.length,
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get images aggregated by folders
app.get('/api/folders', async (req, res) => {
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
    const folderGroups = {};

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
            metadata: mainMetadata,
          },
          additionalImages: additionalThumbnails,
          hasMore: folder.totalCount > 6,
        };
      })
    );

    res.json({
      folders: folderData,
      totalFolders: folderData.length,
      totalImages: images.length,
    });
  } catch (error) {
    console.error('Error fetching folder data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single image metadata
app.get('/api/image/:id', async (req, res) => {
  try {
    const imagePath = Buffer.from(req.params.id, 'base64').toString();
    const fullPath = path.join(IMAGES_DIR, imagePath);

    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const metadata = await getImageMetadata(fullPath);

    res.json({
      id: req.params.id,
      path: imagePath,
      url: `/images/${imagePath}`,
      metadata,
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh cache
app.post('/api/refresh', async (req, res) => {
  try {
    cache.flushAll();
    const images = await getAllImages();
    const categories = await getAllCategories();
    res.json({ 
      message: 'Cache refreshed', 
      imageCount: images.length,
      categoryCount: categories.length 
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Daemon control routes
app.get('/api/daemon/status', (req, res) => {
  try {
    res.json(thumbnailDaemon.getStatus());
  } catch (error) {
    console.error('Error getting daemon status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/daemon/start', (req, res) => {
  try {
    thumbnailDaemon.start();
    res.json({ message: 'Thumbnail daemon started' });
  } catch (error) {
    console.error('Error starting daemon:', error);
    res.status(500).json({ error: 'Failed to start daemon' });
  }
});

app.post('/api/daemon/stop', (req, res) => {
  try {
    thumbnailDaemon.stop();
    res.json({ message: 'Thumbnail daemon stopped' });
  } catch (error) {
    console.error('Error stopping daemon:', error);
    res.status(500).json({ error: 'Failed to stop daemon' });
  }
});

app.post('/api/daemon/generate-all', async (req, res) => {
  try {
    // Run in background to avoid request timeout
    thumbnailDaemon.generateAllThumbnails().catch((error) => {
      console.error('Error in bulk thumbnail generation:', error);
    });
    res.json({ message: 'Bulk thumbnail generation started' });
  } catch (error) {
    console.error('Error starting bulk generation:', error);
    res.status(500).json({ error: 'Failed to start bulk generation' });
  }
});

app.post('/api/daemon/rebuild-index', async (req, res) => {
  try {
    console.log('🔧 Rebuilding thumbnail index...');

    // Clear current index
    thumbnailIndex = {};

    // Scan thumbnails directory and rebuild index
    const images = await scanImagesDirectory(IMAGES_DIR);
    let rebuilt = 0;

    for (const img of images) {
      const { thumbnailPath } = getThumbnailInfo(img.fullPath);

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

    res.json({
      message: 'Thumbnail index rebuilt successfully',
      entries: rebuilt,
    });
  } catch (error) {
    console.error('Error rebuilding index:', error);
    res.status(500).json({ error: 'Failed to rebuild index' });
  }
});

// Get thumbnail index statistics
app.get('/api/daemon/index-stats', (req, res) => {
  try {
    const entries = Object.values(thumbnailIndex);
    const stats = {
      totalEntries: entries.length,
      entriesWithMetadata: entries.filter((entry) => entry.metadata).length,
      entriesWithThumbnails: entries.filter((entry) => entry.thumbnailPath)
        .length,
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    daemon: thumbnailDaemon.getStatus().isWatching
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/images') || req.path.startsWith('/thumbnails')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

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

// Graceful shutdown
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
