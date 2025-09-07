# Ga## Features

- **Recursive folder scanning** - Automatically scans a specified directory and all subdirectories for images
- **Dynamic thumbnail generation** - Creates optimized thumbnails on-the-fly using Jimp with lazy loading
- **Intelligent thumbnail caching** - Only regenerates thumbnails when source images are modified
- **Thumbnail index tracking** - Maintains modification time index for efficient lazy loading
- **Automatic file watching daemon** - Monitors image directory for changes and generates thumbnails automatically
- **Infinite scrolling** - Loads images progressively for better performance
- **Lightbox view** - Full-screen image viewing with navigation
- **Image metadata display** - Shows filename, size, dimensions, and format
- **Search functionality** - Filter images by filename
- **Responsive design** - Works on desktop and mobile devices
- **Caching system** - Improves performance with intelligent caching
- **Daemon control interface** - Monitor and control the thumbnail generation daemon
- **Multiple image formats** - Supports JPG, PNG, GIF, WebP, BMP, and TIFFry

A responsive Node.js image gallery application with thumbnail generation, infinite scrolling, and lightbox view.

## Features

- **Recursive folder scanning** - Automatically scans a specified directory and all subdirectories for images
- **Dynamic thumbnail generation** - Creates optimized thumbnails on-the-fly using Sharp
- **Infinite scrolling** - Loads images progressively for better performance
- **Lightbox view** - Full-screen image viewing with navigation
- **Image metadata display** - Shows filename, size, dimensions, and format
- **Search functionality** - Filter images by filename
- **Responsive design** - Works on desktop and mobile devices
- **Caching system** - Improves performance with intelligent caching
- **Multiple image formats** - Supports JPG, PNG, GIF, WebP, BMP, and TIFF

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Set the `IMAGES_DIR` environment variable to specify the folder containing your images:

```bash
# Windows (PowerShell)
$env:IMAGES_DIR="C:\path\to\your\images"

# Windows (Command Prompt)
set IMAGES_DIR=C:\path\to\your\images

# Linux/Mac
export IMAGES_DIR="/path/to/your/images"
```

If not set, the app will look for images in the `./images` directory.

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. For development with auto-restart:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Directory Structure

```
gallant-gallery/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # CSS styles
│   └── script.js       # Frontend JavaScript
├── thumbnails/         # Generated thumbnails (auto-created)
├── cache/             # Cache directory (auto-created)
│   └── thumbnail-index.json  # Thumbnail index with metadata
├── images/            # Default images directory (auto-created)
├── server.js          # Express server
├── package.json       # Dependencies
└── README.md         # This file
```

## API Endpoints

- `GET /` - Main gallery page
- `GET /api/images` - Get paginated images with search
  - Query parameters: `page`, `limit`, `search`
- `GET /api/image/:id` - Get single image metadata
- `POST /api/refresh` - Refresh image cache
- `GET /api/daemon/status` - Get daemon status
- `POST /api/daemon/start` - Start the daemon
- `POST /api/daemon/stop` - Stop the daemon  
- `POST /api/daemon/generate-all` - Generate thumbnails for all images
- `POST /api/daemon/rebuild-index` - Rebuild the thumbnail index
- `GET /api/daemon/index-stats` - Get detailed thumbnail index statistics
- `POST /api/daemon/rebuild-index` - Rebuild the thumbnail index

## Environment Variables

- `IMAGES_DIR` - Path to the images directory (default: `./images`)
- `PORT` - Server port (default: `3000`)
- `GENERATE_THUMBNAILS_ON_START` - Generate thumbnails for existing images on startup (default: `true`)

## Daemon Features

The application includes a built-in daemon that automatically monitors your images directory:

- **Automatic thumbnail generation** - Creates thumbnails when new images are added
- **File change detection** - Regenerates thumbnails when images are modified
- **Cleanup on deletion** - Removes thumbnails when images are deleted
- **Real-time monitoring** - Uses efficient file system watching
- **Bulk processing** - Can generate thumbnails for all existing images
- **Status monitoring** - Web interface to monitor daemon status and control

### Daemon Controls

- Click the robot icon (🤖) in the header to open the daemon control panel
- Monitor daemon status, watched directory, and processing queue
- Start/stop the daemon manually if needed
- Trigger bulk thumbnail generation for all images

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- TIFF (.tiff)

## Performance Features

- **Lazy thumbnail generation** - Only creates thumbnails when needed and source has changed
- **Thumbnail index system** - Tracks file modification times and metadata in cache folder
- **Metadata caching** - Image information is cached and only re-read when file changes
- **File integrity checking** - Uses modification time and file size for change detection
- **Lazy loading** - Images load as they come into view
- **Progressive loading** - Only loads 20 images at a time
- **Optimized thumbnails** - Uses Jimp for fast, high-quality thumbnail generation
- **Automatic cleanup** - Removes orphaned thumbnails when images are deleted
- **Index persistence** - Thumbnail index survives server restarts

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

1. **Images not showing**: Check that the `IMAGES_DIR` path is correct and accessible
2. **Thumbnails not generating**: Ensure Sharp can process your image files
3. **Performance issues**: For large image collections, consider increasing server resources
4. **Search not working**: Make sure your search terms match filenames (case-insensitive)

## Development

The application uses:
- **Express.js** for the web server
- **Sharp** for image processing
- **Node-cache** for in-memory caching
- **Vanilla JavaScript** for the frontend (no frameworks)

To modify the appearance, edit the CSS in `public/styles.css`. To change functionality, modify `public/script.js` for frontend or `server.js` for backend.
