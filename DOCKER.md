# Docker Support

This gallery application includes Docker support for easy deployment and isolation.

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your specific paths:
   ```bash
   # For Windows
   GALLERY_PORT=3000
   IMAGES_PATH=C:\Users\YourUser\Pictures\YourImageFolder
   CACHE_PATH=C:\Users\YourUser\Documents\gallery-cache

   # For macOS/Linux
   GALLERY_PORT=3000
   IMAGES_PATH=/absolute/path/to/your/images
   CACHE_PATH=/absolute/path/to/your/cache
   ```

3. **Build and run:**
   ```bash
   docker-compose up --build
   ```

## Environment Variables

### Required
- `IMAGES_PATH`: Absolute path to your images directory (mounted as read-only)
- `CACHE_PATH`: Absolute path to cache directory (mounted as read-write)

### Optional
- `GALLERY_PORT`: Port to expose the gallery on (default: 3000)
- `NODE_ENV`: Node environment (default: production)

## Volume Mounts

The Docker setup includes two volume mounts:

1. **Images Directory** (`/app/images`):
   - Mounted as **read-only** from `IMAGES_PATH`
   - Contains your source images
   - Cannot be modified by the container

2. **Cache Directory** (`/app/cache`):
   - Mounted as **read-write** from `CACHE_PATH`
   - Stores generated thumbnails and metadata
   - Persists between container restarts

## Docker Commands

### Basic Operations

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose build --no-cache
```

### Development Commands

```bash
# Build only (without starting)
docker-compose build

# Start with specific environment file
docker-compose --env-file .env.production up

# Override port temporarily
GALLERY_PORT=8080 docker-compose up
```

## Windows-Specific Setup

For Windows users, use the Windows-specific compose file:

```bash
# Use Windows-specific compose file
docker-compose -f docker-compose.windows.yml up --build
```

### Windows Path Examples

In your `.env` file on Windows:

```bash
# Example Windows paths
IMAGES_PATH=C:\Users\YourUser\Pictures\Gallery
CACHE_PATH=C:\Users\YourUser\Documents\gallery-cache
GALLERY_PORT=3000
```

**Important for Windows:**
- Use absolute paths with drive letters (e.g., `C:\...`)
- Ensure Docker Desktop has access to the drives you're mounting
- Check Docker Desktop settings > Resources > File Sharing

## Accessing the Application

Once running, access the gallery at:
- **Local**: http://localhost:3000 (or your configured port)
- **Network**: http://your-host-ip:3000

## Health Checks

The container includes health checks that verify:
- Web server is responding
- Application is healthy
- Thumbnail daemon is running

Check container health:
```bash
docker-compose ps
docker inspect gallant-gallery_gallant-gallery_1 | grep Health -A 10
```

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   ```bash
   # Ensure proper permissions on cache directory
   chmod 755 /path/to/cache
   ```

2. **Path Not Found**:
   - Verify absolute paths in `.env` file
   - Ensure directories exist on host system
   - Check Docker Desktop file sharing settings (Windows/Mac)

3. **Port Already in Use**:
   ```bash
   # Change port in .env file
   GALLERY_PORT=8080
   ```

4. **Memory Issues**:
   ```bash
   # Increase memory limits in docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 1G
   ```

### Debug Mode

Run with debug output:
```bash
# Enable debug logging
docker-compose up --build | tee docker.log
```

### Container Shell Access

Access the running container:
```bash
# Get container ID
docker-compose ps

# Access shell
docker-compose exec gallant-gallery sh

# Or directly
docker exec -it gallant-gallery_gallant-gallery_1 sh
```

## Production Deployment

For production deployment:

1. **Use specific tag versions** in Dockerfile
2. **Set up proper logging**:
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

3. **Configure reverse proxy** (nginx, traefik, etc.)
4. **Set up backup** for cache directory
5. **Monitor resource usage**

## Security Considerations

- Images directory is mounted read-only for security
- Application runs as non-root user inside container
- Health checks ensure application stability
- Resource limits prevent resource exhaustion

## Backup & Recovery

### Backup Cache
```bash
# Create backup of cache directory
tar -czf gallery-cache-backup-$(date +%Y%m%d).tar.gz /path/to/cache
```

### Recovery
```bash
# Restore cache from backup
tar -xzf gallery-cache-backup-YYYYMMDD.tar.gz -C /path/to/restore
```

The cache directory contains:
- Generated thumbnails
- Metadata index
- Performance optimization data
