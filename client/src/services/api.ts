import axios, { AxiosResponse } from 'axios';
import { Image, Folder, Category, CategoryItem, DaemonStatus, SearchParams, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export class ApiService {
  // Image-related APIs
  static async getImages(params: SearchParams): Promise<ApiResponse<Image[]>> {
    const response: AxiosResponse<ApiResponse<Image[]>> = await api.get('/api/images', {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.term,
      },
    });
    return response.data;
  }

  static async getImagesByCategory(categoryName: string, itemName?: string): Promise<Image[]> {
    const response: AxiosResponse<Image[]> = await api.get(`/api/categories/${encodeURIComponent(categoryName)}/images`, {
      params: itemName ? { item: itemName } : {},
    });
    return response.data;
  }

  // Folder-related APIs
  static async getFolders(): Promise<Folder[]> {
    const response: AxiosResponse<Folder[]> = await api.get('/api/folders');
    return response.data;
  }

  static async getFolderImages(folderPath: string): Promise<Image[]> {
    const response: AxiosResponse<Image[]> = await api.get(`/api/folders/${encodeURIComponent(folderPath)}/images`);
    return response.data;
  }

  // Category-related APIs
  static async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<Category[]> = await api.get('/api/categories');
    return response.data;
  }

  static async getCategoryItems(categoryName: string): Promise<CategoryItem[]> {
    const response: AxiosResponse<CategoryItem[]> = await api.get(`/api/categories/${encodeURIComponent(categoryName)}/items`);
    return response.data;
  }

  // Daemon-related APIs
  static async getDaemonStatus(): Promise<DaemonStatus> {
    const response: AxiosResponse<DaemonStatus> = await api.get('/api/daemon/status');
    return response.data;
  }

  static async startDaemon(): Promise<{ success: boolean; message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post('/api/daemon/start');
    return response.data;
  }

  static async stopDaemon(): Promise<{ success: boolean; message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post('/api/daemon/stop');
    return response.data;
  }

  static async generateAllThumbnails(): Promise<{ success: boolean; message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post('/api/daemon/generate-all');
    return response.data;
  }

  static async rebuildIndex(): Promise<{ success: boolean; message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post('/api/daemon/rebuild-index');
    return response.data;
  }

  // Utility APIs
  static async refreshGallery(): Promise<{ success: boolean; message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await api.post('/api/refresh');
    return response.data;
  }

  // Get image URL for display
  static getImageUrl(imagePath: string): string {
    return `${API_BASE_URL}/api/image/${encodeURIComponent(imagePath)}`;
  }

  // Get thumbnail URL for display
  static getThumbnailUrl(thumbnailPath: string): string {
    // The thumbnailPath should be just the filename from the thumbnail system
    return `${API_BASE_URL}/thumbnails/${thumbnailPath}`;
  }
}

export default ApiService;
