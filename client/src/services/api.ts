import axios, { AxiosResponse } from 'axios';
import {
  Image,
  Folder,
  Category,
  CategoryItem,
  ItemImage,
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
  SearchQuery,
  PaginationQuery,
  ErrorResponse,
} from '../types/api-definitions';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:12512';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export class ApiService {
  // Image-related APIs
  static async getImages(params: SearchQuery): Promise<ImagesResponse> {
    const response: AxiosResponse<ImagesResponse> = await api.get(
      '/api/images',
      {
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search,
        },
      }
    );
    return response.data;
  }

  static async getItemImages(
    categoryPath: string,
    itemName: string,
    params?: PaginationQuery
  ): Promise<ItemImagesResponse> {
    const response: AxiosResponse<ItemImagesResponse> = await api.get(
      `/api/items/${encodeURIComponent(categoryPath)}/${encodeURIComponent(itemName)}/images`,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
        },
      }
    );
    return response.data;
  }

  // Folder-related APIs
  static async getFolders(params?: { search?: string }): Promise<FoldersResponse> {
    const response: AxiosResponse<FoldersResponse> = await api.get('/api/folders', {
      params: params,
    });
    return response.data;
  }

  // Category-related APIs
  static async getCategories(): Promise<CategoriesResponse> {
    const response: AxiosResponse<CategoriesResponse> = await api.get('/api/categories');
    return response.data;
  }

  static async getCategoryItems(
    categoryPath: string,
    params?: SearchQuery
  ): Promise<CategoryItemsResponse> {
    const response: AxiosResponse<CategoryItemsResponse> = await api.get(
      `/api/categories/${encodeURIComponent(categoryPath)}/items`,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
          search: params?.search,
        },
      }
    );
    return response.data;
  }

  // Daemon-related APIs
  static async getDaemonStatus(): Promise<DaemonStatus> {
    const response: AxiosResponse<DaemonStatus> = await api.get(
      '/api/daemon/status'
    );
    return response.data;
  }

  static async startDaemon(): Promise<DaemonResponse> {
    const response: AxiosResponse<DaemonResponse> = await api.post('/api/daemon/start');
    return response.data;
  }

  static async stopDaemon(): Promise<DaemonResponse> {
    const response: AxiosResponse<DaemonResponse> = await api.post('/api/daemon/stop');
    return response.data;
  }

  static async generateAllThumbnails(): Promise<DaemonResponse> {
    const response: AxiosResponse<DaemonResponse> = await api.post('/api/daemon/generate-all');
    return response.data;
  }

  static async rebuildIndex(): Promise<RebuildIndexResponse> {
    const response: AxiosResponse<RebuildIndexResponse> = await api.post('/api/daemon/rebuild-index');
    return response.data;
  }

  static async getIndexStats(): Promise<IndexStats> {
    const response: AxiosResponse<IndexStats> = await api.get('/api/daemon/index-stats');
    return response.data;
  }

  // Utility APIs
  static async refreshGallery(): Promise<RefreshResponse> {
    const response: AxiosResponse<RefreshResponse> = await api.post('/api/refresh');
    return response.data;
  }

  // Get single image by ID
  static async getImage(id: string): Promise<ImageResponse> {
    const response: AxiosResponse<ImageResponse> = await api.get(`/api/image/${encodeURIComponent(id)}`);
    return response.data;
  }

  // Get image URL for display
  static getImageUrl(path: string): string {
    return `${API_BASE_URL}/images/${path}`;
  }

  // Get thumbnail URL for display
  static getThumbnailUrl(thumbnailPath: string): string {
    // The thumbnailPath should be just the filename from the thumbnail system
    return `${API_BASE_URL}${thumbnailPath}`;
  }
}

export default ApiService;
