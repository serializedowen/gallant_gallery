import { Language } from '../types';

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  zh: {
    // Header
    'app.title': '迦蓝画廊',
    'search.placeholder': '搜索图片...',
    'refresh.tooltip': '刷新画廊',
    'daemon.tooltip': '后台进程状态',

    // Navigation
    'nav.categories': '分类',
    'nav.folders': '文件夹',
    'nav.allImages': '所有图片',

    // Category view
    'category.title': '分类',
    'category.search.placeholder': '搜索分类...',
    'category.select': '选择分类',
    'category.select.description': '从侧边栏选择一个分类来查看其项目',
    'category.noItems': '此分类中没有找到项目',

    // Stats
    'stats.categories': '个分类',
    'stats.category': '个分类',
    'stats.items': '个项目',
    'stats.item': '个项目',
    'stats.images': '张图片',
    'stats.image': '张图片',
    'stats.folders': '个文件夹',
    'stats.folder': '个文件夹',

    // Loading and errors
    'loading.images': '加载图片中...',
    'loading.categories': '加载分类中...',
    'loading.items': '加载项目中...',
    'error.loadImages': '加载图片失败',
    'error.loadCategories': '加载分类失败',
    'error.loadItems': '加载项目失败',
    'error.noResults': '未找到图片',
    'error.noResults.description': '请尝试调整搜索条件',

    // Lightbox
    'lightbox.size': '大小',
    'lightbox.dimensions': '尺寸',
    'lightbox.format': '格式',
    'lightbox.directory': '目录',

    // Buttons
    'button.close': '关闭',
    'button.previous': '上一张',
    'button.next': '下一张',

    // Daemon
    'daemon.title': '缩略图守护进程',
    'daemon.status': '状态',
    'daemon.watching': '监视目录',
    'daemon.queue': '处理队列',
    'daemon.queue.empty': '空',
    'daemon.indexEntries': '索引条目',
    'daemon.metadataCache': '元数据缓存',
    'daemon.thumbnailIndex': '缩略图索引',
    'daemon.start': '启动守护进程',
    'daemon.stop': '停止守护进程',
    'daemon.generateAll': '生成所有缩略图',
    'daemon.rebuildIndex': '重建索引',
    'daemon.status.running': '运行中',
    'daemon.status.stopped': '已停止',
  },
  en: {
    // Header
    'app.title': 'Gallant Gallery',
    'search.placeholder': 'Search images...',
    'refresh.tooltip': 'Refresh gallery',
    'daemon.tooltip': 'Daemon process status',

    // Navigation
    'nav.categories': 'Categories',
    'nav.folders': 'Folders',
    'nav.allImages': 'All Images',

    // Category view
    'category.title': 'Categories',
    'category.search.placeholder': 'Search categories...',
    'category.select': 'Select Category',
    'category.select.description':
      'Choose a category from the sidebar to view its items',
    'category.noItems': 'No items found in this category',

    // Stats
    'stats.categories': ' categories',
    'stats.category': ' category',
    'stats.items': ' items',
    'stats.item': ' item',
    'stats.images': ' images',
    'stats.image': ' image',
    'stats.folders': ' folders',
    'stats.folder': ' folder',

    // Loading and errors
    'loading.images': 'Loading images...',
    'loading.categories': 'Loading categories...',
    'loading.items': 'Loading items...',
    'error.loadImages': 'Failed to load images',
    'error.loadCategories': 'Failed to load categories',
    'error.loadItems': 'Failed to load items',
    'error.noResults': 'No images found',
    'error.noResults.description': 'Try adjusting your search criteria',

    // Lightbox
    'lightbox.size': 'Size',
    'lightbox.dimensions': 'Dimensions',
    'lightbox.format': 'Format',
    'lightbox.directory': 'Directory',

    // Buttons
    'button.close': 'Close',
    'button.previous': 'Previous',
    'button.next': 'Next',

    // Daemon
    'daemon.title': 'Thumbnail Daemon',
    'daemon.status': 'Status',
    'daemon.watching': 'Watching Directory',
    'daemon.queue': 'Processing Queue',
    'daemon.queue.empty': 'Empty',
    'daemon.indexEntries': 'Index Entries',
    'daemon.metadataCache': 'Metadata Cache',
    'daemon.thumbnailIndex': 'Thumbnail Index',
    'daemon.start': 'Start Daemon',
    'daemon.stop': 'Stop Daemon',
    'daemon.generateAll': 'Generate All Thumbnails',
    'daemon.rebuildIndex': 'Rebuild Index',
    'daemon.status.running': 'Running',
    'daemon.status.stopped': 'Stopped',
  },
};

class I18nService {
  private currentLanguage: Language = 'zh';
  private listeners: ((lang: Language) => void)[] = [];

  constructor() {
    // Load language from localStorage or default to 'zh'
    const savedLang = localStorage.getItem(
      'gallant-gallery-language'
    ) as Language;
    if (savedLang && ['zh', 'en'].includes(savedLang)) {
      this.currentLanguage = savedLang;
    }


    this.t = this.t.bind(this);
    this.formatCount = this.formatCount.bind(this);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(language: Language): void {
    if (language !== this.currentLanguage) {
      this.currentLanguage = language;
      localStorage.setItem('gallant-gallery-language', language);
      document.title = this.t('app.title');
      this.notifyListeners();
    }
  }

  t(key: string, params = {}): string {
    const translation =
      translations[this.currentLanguage][key] || translations['en'][key] || key;

    // Simple parameter replacement
    return Object.keys(params).reduce((text, param) => {
      return text.replace(`{{${param}}}`, params[param]);
    }, translation);
  }

  // Format count with appropriate unit
  formatCount(
    count: number,
    type: 'categories' | 'items' | 'images' | 'folders'
  ): string {
    const isZhCN = this.currentLanguage === 'zh';

    if (isZhCN) {
      // Chinese formatting: number + unit
      switch (type) {
        case 'categories':
          return `${count}${this.t(
            count === 1 ? 'stats.category' : 'stats.categories'
          )}`;
        case 'items':
          return `${count}${this.t(
            count === 1 ? 'stats.item' : 'stats.items'
          )}`;
        case 'folders':
          return `${count}${this.t(
            count === 1 ? 'stats.folder' : 'stats.folders'
          )}`;
        default:
          return `${count}${this.t(
            count === 1 ? 'stats.image' : 'stats.images'
          )}`;
      }
    } else {
      // English formatting: count + unit
      switch (type) {
        case 'categories':
          return `${count}${this.t(
            count === 1 ? 'stats.category' : 'stats.categories'
          )}`;
        case 'items':
          return `${count}${this.t(
            count === 1 ? 'stats.item' : 'stats.items'
          )}`;
        case 'folders':
          return `${count}${this.t(
            count === 1 ? 'stats.folder' : 'stats.folders'
          )}`;
        default:
          return `${count}${this.t(
            count === 1 ? 'stats.image' : 'stats.images'
          )}`;
      }
    }
  }

  subscribe(listener: (lang: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentLanguage));
  }
}

export const i18n = new I18nService();
export default i18n;
