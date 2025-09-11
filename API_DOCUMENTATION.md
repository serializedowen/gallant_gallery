# API Documentation for Gallant Gallery

This document describes the API endpoints and their type definitions for the Gallant Gallery application.

## Files Overview

- `api-definitions.ts` - Contains all TypeScript type definitions, interfaces, and endpoint specifications
- `api-handlers.ts` - Contains the actual Express.js route handlers with proper typing
- `server.js` - The main server file (original implementation)

## Using the API Definitions

### Type-Safe API Endpoints

The `api-definitions.ts` file provides complete type safety for all API endpoints. Each endpoint is defined with:

- Request parameters
- Query parameters  
- Request body
- Response type

```typescript
import { ApiHandler, CategoriesResponse } from './api-definitions';

// Example: Type-safe handler for getting categories
const getCategories: ApiHandler<'GET /api/categories'> = async (req, res) => {
  // TypeScript knows the exact types for req and res
  const response: CategoriesResponse = {
    categories: [],
    totalCategories: 0
  };
  res.json(response);
};
```

### Available Endpoints

#### Category Endpoints
- `GET /api/categories` - Get all categories with counts
- `GET /api/categories/:categoryPath/items` - Get items in a category (with pagination/search)

#### Item Endpoints  
- `GET /api/items/:categoryPath/:itemName/images` - Get images for a specific item

#### Image Endpoints
- `GET /api/images` - Get all images (with pagination/search)
- `GET /api/image/:id` - Get single image metadata
- `GET /api/folders` - Get images grouped by folders

#### Cache Endpoints
- `POST /api/refresh` - Refresh the image cache

#### Daemon Control Endpoints
- `GET /api/daemon/status` - Get thumbnail daemon status
- `POST /api/daemon/start` - Start the daemon
- `POST /api/daemon/stop` - Stop the daemon  
- `POST /api/daemon/generate-all` - Generate all thumbnails
- `POST /api/daemon/rebuild-index` - Rebuild thumbnail index
- `GET /api/daemon/index-stats` - Get index statistics

#### System Endpoints
- `GET /health` - Health check for monitoring
- `GET /` - Serve main gallery page

## Type Definitions

### Core Types

```typescript
interface ImageMetadata {
  filename: string;
  size: number;
  width: number | null;
  height: number | null;
  format: string;
  lastModified: Date;
}

interface Image {
  id: string;
  path: string;
  thumbnail: string;
  directory: string;
  metadata: ImageMetadata;
}

interface Category {
  name: string;
  path: string;
  itemCount: number;
  imageCount: number;
}
```

### Query Parameters

```typescript
interface PaginationQuery {
  page?: string;
  limit?: string;
}

interface SearchQuery extends PaginationQuery {
  search?: string;
}
```

### Response Types

All responses are strongly typed. For example:

```typescript
interface CategoriesResponse {
  categories: Category[];
  totalCategories: number;
}

interface ImagesResponse {
  images: Image[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

## Error Handling

All endpoints can return an `ErrorResponse`:

```typescript
interface ErrorResponse {
  error: string;
}
```

Use the `ApiError` class for consistent error handling:

```typescript
throw new ApiError(404, 'Image not found');
```

## Migration from server.js

To migrate from the original `server.js` implementation:

1. **Extract service functions**: Move business logic functions to separate modules
2. **Use typed handlers**: Replace Express handlers with typed versions from `api-handlers.ts`
3. **Implement router**: Use the `createApiRouter()` function to set up routes
4. **Add error handling**: Use the provided error handling middleware

### Example Migration

**Before (server.js):**
```javascript
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**After (with types):**
```typescript
const getCategories: ApiHandler<'GET /api/categories'> = async (req, res) => {
  try {
    const categories = await getAllCategories();
    const response: CategoriesResponse = {
      categories,
      totalCategories: categories.length
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};
```

## Constants

The definitions file includes useful constants:

```typescript
export const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
export const DEFAULT_PAGINATION = { page: 1, limit: 20 };
export const THUMBNAIL_SIZE = 300;
export const CACHE_TTL = 3600; // 1 hour
```

## HTTP Status Codes

```typescript
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
```

## Benefits of Type Definitions

1. **Type Safety**: Catch errors at compile time instead of runtime
2. **IntelliSense**: Better IDE support with autocomplete and parameter hints
3. **Documentation**: Types serve as living documentation
4. **Refactoring**: Safe refactoring with TypeScript compiler checks
5. **API Contract**: Clear contract between frontend and backend
6. **Testing**: Easier to write tests with known types

## Frontend Integration

These types can be shared with a TypeScript frontend:

```typescript
// Frontend API client example
import type { CategoriesResponse, ErrorResponse } from './api-definitions';

async function getCategories(): Promise<CategoriesResponse> {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error);
  }
  return response.json();
}
```

This ensures type safety across the entire application stack.
