# Gallant Gallery

A responsive Node.js image gallery application with TypeScript support, thumbnail generation, infinite scrolling, and lightbox view.

## Features

### Core Gallery Features
- **Recursive folder scanning** - Automatically scans a specified directory and all subdirectories for images
- **Dynamic thumbnail generation** - Creates optimized thumbnails on-the-fly using Sharp
- **Intelligent thumbnail caching** - Only regenerates thumbnails when source images are modified
- **Thumbnail index tracking** - Maintains modification time index for efficient lazy loading
- **Automatic file watching daemon** - Monitors image directory for changes and generates thumbnails automatically
- **Multiple image formats** - Supports JPG, PNG, GIF, WebP, BMP, and TIFF

### Modern React Frontend
- **React 19** - Modern React application with hooks and functional components
- **TypeScript frontend** - Fully typed React components for better development experience
- **Material-UI (MUI)** - Modern, responsive design with Material Design components
- **Dark theme** - Built-in dark theme for better viewing experience
- **Internationalization (i18n)** - Multi-language support (Chinese/English)
- **React Router** - Client-side routing for seamless navigation

### Advanced Navigation & Views
- **Category-based navigation** - Organize images by directory structure categories
- **Folder view** - Browse images by folder hierarchy
- **Grid view** - Modern grid layout for image browsing
- **Bottom navigation** - Mobile-friendly navigation with Material-UI bottom navigation
- **Search functionality** - Real-time search across all views
- **Infinite scrolling** - Progressive image loading for optimal performance

### Enhanced User Experience
- **Lightbox view** - Full-screen image viewing with smooth navigation
- **Image metadata display** - Comprehensive image information (size, dimensions, format, etc.)
- **Loading states** - Elegant loading indicators throughout the application
- **Error handling** - User-friendly error messages and retry mechanisms
- **Responsive design** - Optimized for desktop, tablet, and mobile devices

### Developer Features
- **Full TypeScript stack** - Type-safe development from frontend to backend
- **API-first architecture** - RESTful API with comprehensive type definitions
- **Component-based architecture** - Modular React components for maintainability
- **Context-based state management** - Centralized application state with React Context
- **Hot reloading** - Fast development with hot module replacement
- **Concurrent development** - Run client and server simultaneously
- **Daemon control interface** - Advanced thumbnail generation monitoring and control

## Installation

### Quick Start
1. Clone or download this repository
2. Install all dependencies (root, server, and client):
   ```bash
   npm run install:all
   ```

### Manual Installation
1. Clone or download this repository
2. Install root dependencies:
   ```bash
   npm install
   ```
3. Install server dependencies:
   ```bash
   npm run server:install
   ```
4. Install client dependencies:
   ```bash
   npm run client:install
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

### Development Mode
Start both client and server in development mode with hot reloading:
```bash
npm start
```

Or run them separately:
```bash
# Terminal 1 - Start React development server
npm run dev:client

# Terminal 2 - Start TypeScript server with auto-restart
npm run dev:server
```

### Production Build
1. Build the React client:
   ```bash
   npm run client:build
   ```

2. Build the TypeScript server:
   ```bash
   npm run build
   ```

3. Start the production server:
   ```bash
   cd server && npm start
   ```

### Access the Application
- **Development**: React dev server runs on `http://localhost:3000`
- **Production**: Express server runs on `http://localhost:12512`

### Docker Deployment
For containerized deployment:
```bash
# Build and start with Docker Compose
npm run docker:up:build

# Or manually
docker-compose up --build
```

### Navigation
- **Categories View** - Browse images organized by directory structure
- **Folders View** - Navigate through folder hierarchy  
- **Grid View** - View all images in a responsive grid
- Use the bottom navigation bar to switch between views
- Search functionality is available in the header across all views

## Project Structure

```
gallant-gallery/
├── client/                    # React TypeScript frontend
│   ├── src/                   # React source code
│   │   ├── components/        # React components
│   │   │   ├── Header/        # App header with search and controls
│   │   │   ├── Navigation/    # Bottom navigation bar
│   │   │   ├── Views/         # Main view components
│   │   │   │   ├── CategoryView/  # Category browsing interface
│   │   │   │   ├── FolderView/    # Folder navigation interface
│   │   │   │   └── GridView/      # Grid image display
│   │   │   ├── ImageCard/     # Individual image display component
│   │   │   ├── Lightbox/      # Full-screen image viewer
│   │   │   ├── DaemonModal/   # Daemon control interface
│   │   │   └── common/        # Shared components
│   │   ├── contexts/          # React Context providers
│   │   │   └── AppContext.tsx # Global application state
│   │   ├── services/          # API and utility services
│   │   │   ├── api.ts         # API service layer
│   │   │   └── i18n.ts        # Internationalization service
│   │   ├── types/             # TypeScript type definitions
│   │   └── App.tsx            # Main React application
│   ├── build/                 # Built React app (production)
│   ├── package.json           # Client dependencies
│   └── tsconfig.json          # Frontend TypeScript config
├── server/                    # TypeScript server code
│   ├── server.ts              # Main TypeScript server file
│   ├── api-definitions.ts     # API type definitions
│   ├── api-handlers.ts        # API route handlers
│   ├── package.json           # Server dependencies
│   ├── tsconfig.json          # Server TypeScript configuration
│   └── dist/                  # Compiled server code
├── public/                    # Legacy static assets (fallback)
│   ├── index.html             # Fallback HTML file
│   ├── styles.css             # Legacy CSS styles
│   └── script.js              # Legacy frontend JavaScript
├── cache/                     # Cache directory (auto-created)
│   ├── thumbnails/            # Generated thumbnails
│   └── thumbnail-index.json   # Thumbnail index with metadata
├── images/                    # Default images directory (auto-created)
├── package.json               # Root package.json for scripts and tools
├── tsconfig.json              # Root TypeScript configuration
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker compose setup
└── README.md                  # This file
```

## API Endpoints

### Core Image APIs
- `GET /api/images` - Get paginated images with search
  - Query parameters: `page`, `limit`, `search`
- `GET /api/image/:id` - Get single image metadata

### Category APIs
- `GET /api/categories` - Get all categories
- `GET /api/categories/:categoryPath/items` - Get items within a category
  - Query parameters: `page`, `limit`, `search`
- `GET /api/items/:categoryPath/:itemName/images` - Get images for a specific category item
  - Query parameters: `page`, `limit`

### Folder APIs  
- `GET /api/folders` - Get all folders with image counts
  - Query parameters: `search`

### Cache Management
- `POST /api/refresh` - Refresh image cache
- `POST /api/daemon/rebuild-index` - Rebuild the thumbnail index

### Daemon Control APIs
- `GET /api/daemon/status` - Get comprehensive daemon status
- `POST /api/daemon/start` - Start the thumbnail generation daemon
- `POST /api/daemon/stop` - Stop the daemon  
- `POST /api/daemon/generate-all` - Generate thumbnails for all images
- `GET /api/daemon/index-stats` - Get detailed thumbnail index statistics

### Health & Utilities
- `GET /health` - Health check endpoint
- `GET /` - Serve React application (production) or redirect to dev server

## Environment Variables

- `IMAGES_DIR` - Path to the images directory (default: `./images`)
- `PORT` - Server port (default: `12512`)
- `GENERATE_THUMBNAILS_ON_START` - Generate thumbnails for existing images on startup (default: `true`)
- `REACT_APP_API_URL` - API base URL for React client (default: `http://localhost:12512`)

## Development Scripts

### Main Development
- `npm start` - Start both client and server in development mode (recommended)
- `npm run dev:client` - Start React development server only
- `npm run dev:server` - Start TypeScript server in development mode only

### Building
- `npm run build` - Build TypeScript server for production
- `npm run client:build` - Build React client for production

### Installation
- `npm run install:all` - Install all dependencies (root, server, client)
- `npm run server:install` - Install server dependencies only
- `npm run client:install` - Install client dependencies only

### Docker
- `npm run docker:build` - Build Docker images
- `npm run docker:up` - Start services with Docker Compose
- `npm run docker:up:build` - Build and start services
- `npm run docker:down` - Stop Docker services

### Legacy Aliases
- `npm run server` - Alias for `npm run dev:server`
- `npm run client` - Alias for `npm run dev:client`

## Technology Stack

### Frontend
- **React 19** - Modern React with latest features and hooks
- **TypeScript** - Full type safety and better development experience
- **Material-UI (MUI v5)** - Modern Material Design component library
- **React Router v6** - Client-side routing and navigation
- **Axios** - HTTP client for API communication
- **React Slick** - Carousel component for image navigation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Sharp** - High-performance image processing
- **Chokidar** - File system watching for automatic updates
- **Node-cache** - In-memory caching system

### Development & Build
- **Create React App** - React development environment
- **React Scripts** - Build tools and development server
- **Concurrently** - Run multiple npm scripts simultaneously
- **Nodemon** - Automatic server restart during development

### Deployment & DevOps
- **Docker** - Containerization support
- **Docker Compose** - Multi-container orchestration
- **Heroku** - Cloud deployment support (with Heroku postbuild script)

## Key Features in Detail

### Multi-Language Support
The application supports internationalization with:
- **Chinese (zh)** and **English (en)** languages
- Dynamic language switching via header controls
- Localized text for all UI elements and messages
- Proper number formatting and pluralization

### Advanced Image Organization
- **Category-based browsing** - Images organized by top-level directory structure
- **Folder hierarchy navigation** - Navigate through nested folder structures
- **Smart thumbnail generation** - Automatic thumbnail creation with caching
- **Metadata extraction** - Rich image information display

### Modern User Interface
- **Material Design** - Clean, modern interface with Material-UI components
- **Dark theme** - Built-in dark theme for better viewing experience
- **Responsive layout** - Optimized for all screen sizes and devices
- **Bottom navigation** - Mobile-friendly navigation pattern
- **Loading states** - Smooth loading indicators and skeleton screens

### Performance Optimizations
- **Lazy loading** - Images load as they come into view
- **Virtual scrolling** - Efficient rendering of large image collections
- **Thumbnail caching** - Intelligent caching system for faster loading
- **API pagination** - Server-side pagination for optimal performance
- **Hot module replacement** - Fast development with instant updates

## Daemon Features

The application includes a built-in daemon that automatically monitors your images directory:

### Automatic Processing
- **Thumbnail generation** - Creates thumbnails when new images are added
- **File change detection** - Regenerates thumbnails when images are modified
- **Cleanup on deletion** - Removes orphaned thumbnails when images are deleted
- **Real-time monitoring** - Uses efficient file system watching with Chokidar
- **Bulk processing** - Can generate thumbnails for all existing images

### Daemon Controls
- **Web interface** - Click the robot icon (🤖) in the header to open daemon controls
- **Status monitoring** - Real-time status of daemon, watched directory, and processing queue
- **Manual control** - Start/stop the daemon as needed
- **Bulk operations** - Trigger thumbnail generation for all images
- **Index management** - Rebuild thumbnail index and view statistics

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

### Minimum Requirements
- **Chrome 88+** (January 2021)
- **Firefox 85+** (January 2021)  
- **Safari 14+** (September 2020)
- **Edge 88+** (January 2021)

### Modern Features Used
- ES2020+ JavaScript features
- CSS Grid and Flexbox
- Fetch API and Promises
- CSS Custom Properties (variables)
- Intersection Observer API (for lazy loading)

## Troubleshooting

### Common Issues

#### Images not showing
- Check that the `IMAGES_DIR` path is correct and accessible
- Verify that the daemon is running (check daemon status in the UI)
- Ensure Sharp can process your image files (check supported formats)

#### Frontend not loading
- Make sure both client and server are running in development mode
- Check that React dev server is accessible at `http://localhost:3000`
- Verify that `REACT_APP_API_URL` is set correctly for production builds

#### Build issues
- Ensure all dependencies are installed with `npm run install:all`
- Check Node.js version compatibility (Node 16+ recommended)
- For TypeScript errors, verify that types are correctly shared between client and server

#### Performance issues
- For large image collections, consider increasing server resources
- Monitor daemon status to ensure thumbnails are being generated
- Check thumbnail cache directory for proper permissions

#### Search not working
- Make sure your search terms match filenames (search is case-insensitive)
- Verify that the search API endpoints are responding correctly

#### Docker issues
- Ensure Docker and Docker Compose are installed and running
- Check that ports 3000 and 12512 are not in use by other applications
- For Windows, use the Windows-specific Docker Compose file: `npm run docker:windows`

## Development

### Architecture Overview
The application follows a modern full-stack architecture:

#### Frontend (React)
- **Component-based architecture** - Modular, reusable React components
- **Context-based state management** - Centralized app state with React Context
- **Service layer pattern** - Dedicated API service for server communication
- **Type-safe development** - Full TypeScript integration with strict typing
- **Material Design** - Consistent UI/UX with Material-UI components

#### Backend (Node.js/Express)
- **RESTful API design** - Clean, predictable API endpoints
- **TypeScript-first** - Server-side type safety and better development experience
- **Modular architecture** - Separated concerns with dedicated handlers and definitions
- **Efficient caching** - Multi-level caching for thumbnails and metadata
- **File system monitoring** - Real-time directory watching with Chokidar

#### Key Development Features
- **Hot reloading** - Instant updates during development for both client and server
- **Concurrent development** - Run React dev server and Node.js server simultaneously
- **Type sharing** - Shared TypeScript definitions between frontend and backend
- **API-first design** - Backend API can be consumed by any frontend framework
- **Docker support** - Containerized deployment with multi-stage builds

### Customization Guide
- **Styling**: Modify Material-UI theme in `client/src/App.tsx`
- **Components**: Add new React components in `client/src/components/`
- **API endpoints**: Extend server API in `server/server.ts` and `server/api-handlers.ts`
- **Translations**: Add new languages in `client/src/services/i18n.ts`
- **Types**: Update shared types in both `client/src/types/` and `server/api-definitions.ts`
