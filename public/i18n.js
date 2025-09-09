// Internationalization system for Gallant Gallery
class I18n {
  constructor() {
    this.currentLanguage = 'zh';
    this.supportedLanguages = ['zh', 'en'];
    this.translations = {
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

        // Daemon modal
        'daemon.title': '缩略图守护进程',
        'daemon.status': '状态',
        'daemon.watching': '监视目录',
        'daemon.queue': '处理队列',
        'daemon.indexEntries': '索引条目',
        'daemon.metadataCache': '元数据缓存',
        'daemon.thumbnailIndex': '缩略图索引',
        'daemon.start': '启动守护进程',
        'daemon.stop': '停止守护进程',
        'daemon.generateAll': '生成所有缩略图',
        'daemon.rebuildIndex': '重建索引',
        'daemon.status.running': '运行中',
        'daemon.status.stopped': '已停止',
        'daemon.queue.empty': '空',

        // Messages
        'message.refreshed': '缓存已刷新',
        'message.daemonStarted': '缩略图守护进程已启动',
        'message.daemonStopped': '缩略图守护进程已停止',
        'message.generatingThumbnails': '批量缩略图生成已开始',
        'message.indexRebuilt': '缩略图索引重建成功',

        // Buttons
        'button.close': '关闭',
        'button.previous': '上一张',
        'button.next': '下一张',
      },

      en: {
        // Header
        'app.title': 'Gallant Gallery',
        'search.placeholder': 'Search images...',
        'refresh.tooltip': 'Refresh Gallery',
        'daemon.tooltip': 'Daemon Status',

        // Navigation
        'nav.categories': 'Categories',
        'nav.folders': 'Folders',
        'nav.allImages': 'All Images',

        // Category view
        'category.title': 'Categories',
        'category.search.placeholder': 'Search categories...',
        'category.select': 'Select a category',
        'category.select.description': 'Choose a category from the sidebar to view its items',
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
        'error.noResults.description': 'Try adjusting your search terms',

        // Lightbox
        'lightbox.size': 'Size',
        'lightbox.dimensions': 'Dimensions',
        'lightbox.format': 'Format',
        'lightbox.directory': 'Directory',

        // Daemon modal
        'daemon.title': 'Thumbnail Daemon',
        'daemon.status': 'Status',
        'daemon.watching': 'Watching',
        'daemon.queue': 'Processing Queue',
        'daemon.indexEntries': 'Index Entries',
        'daemon.metadataCache': 'Metadata Cache',
        'daemon.thumbnailIndex': 'Thumbnail Index',
        'daemon.start': 'Start Daemon',
        'daemon.stop': 'Stop Daemon',
        'daemon.generateAll': 'Generate All Thumbnails',
        'daemon.rebuildIndex': 'Rebuild Index',
        'daemon.status.running': 'Running',
        'daemon.status.stopped': 'Stopped',
        'daemon.queue.empty': 'Empty',

        // Messages
        'message.refreshed': 'Cache refreshed',
        'message.daemonStarted': 'Thumbnail daemon started',
        'message.daemonStopped': 'Thumbnail daemon stopped',
        'message.generatingThumbnails': 'Bulk thumbnail generation started',
        'message.indexRebuilt': 'Thumbnail index rebuilt successfully',

        // Buttons
        'button.close': 'Close',
        'button.previous': 'Previous',
        'button.next': 'Next',
      }
    };

    // Initialize with saved language or default
    this.initializeLanguage();
  }

  initializeLanguage() {
    const savedLanguage = localStorage.getItem('gallant-gallery-language');
    if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
      this.currentLanguage = savedLanguage;
    }
  }

  setLanguage(language) {
    if (this.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
      localStorage.setItem('gallant-gallery-language', language);
      this.updateUI();
    }
  }

  t(key, params = {}) {
    const translation = this.translations[this.currentLanguage][key] || 
                       this.translations['en'][key] || 
                       key;
    
    // Simple parameter replacement
    return Object.keys(params).reduce((text, param) => {
      return text.replace(`{{${param}}}`, params[param]);
    }, translation);
  }

  formatCount(count, type) {
    const isZhCN = this.currentLanguage === 'zh';
    
    if (isZhCN) {
      // Chinese formatting: number + unit
      switch (type) {
        case 'categories':
          return `${count}${this.t(count === 1 ? 'stats.category' : 'stats.categories')}`;
        case 'items':
          return `${count}${this.t(count === 1 ? 'stats.item' : 'stats.items')}`;
        case 'folders':
          return `${count}${this.t(count === 1 ? 'stats.folder' : 'stats.folders')}`;
        default:
          return `${count}${this.t(count === 1 ? 'stats.image' : 'stats.images')}`;
      }
    } else {
      // English formatting: count + unit
      switch (type) {
        case 'categories':
          return `${count}${this.t(count === 1 ? 'stats.category' : 'stats.categories')}`;
        case 'items':
          return `${count}${this.t(count === 1 ? 'stats.item' : 'stats.items')}`;
        case 'folders':
          return `${count}${this.t(count === 1 ? 'stats.folder' : 'stats.folders')}`;
        default:
          return `${count}${this.t(count === 1 ? 'stats.image' : 'stats.images')}`;
      }
    }
  }

  updateUI() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Update title attribute for tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });

    // Update page title
    document.title = this.t('app.title');

    // Trigger custom event for components that need to update
    document.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: this.currentLanguage }
    }));
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

// Global instance
window.i18n = new I18n();
