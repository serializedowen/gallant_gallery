class GalleryApp {
  constructor() {
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
    this.searchTerm = '';
    this.categorySearch = '';
    this.images = [];
    this.folders = [];
    this.categories = [];
    this.currentItems = [];
    this.currentImageIndex = 0;
    this.currentView = 'categories'; // 'categories', 'folders', or 'grid'
    this.selectedCategory = null;
    this.selectedItem = null;

    this.initializeElements();
    this.initializeI18n();
    this.attachEventListeners();
    this.loadContent();
    this.updateDaemonStatus();

    // Update daemon status periodically
    setInterval(() => {
      this.updateDaemonStatus();
    }, 5000);
  }

  initializeI18n() {
    // Initialize the UI with current language
    window.i18n.updateUI();
    
    // Listen for language changes
    document.addEventListener('languageChanged', () => {
      this.updateUIForLanguageChange();
    });
  }

  updateUIForLanguageChange() {
    // Update search placeholder
    this.searchInput.placeholder = window.i18n.t('search.placeholder');
    this.categorySearch.placeholder = window.i18n.t('category.search.placeholder');
    
    // Update loading text
    const loadingSpan = this.loading.querySelector('span');
    if (loadingSpan) {
      loadingSpan.textContent = window.i18n.t('loading.images');
    }
    
    // Update current language display
    this.updateLanguageDisplay();
    
    // Re-render categories if they're loaded
    if (this.categories.length > 0) {
      this.renderCategories(this.categories);
    }
    
    // Update total count display
    if (this.totalCount.textContent) {
      // Re-trigger count update to use new language
      const currentCount = parseInt(this.totalCount.textContent.match(/\d+/)?.[0] || '0');
      let type = 'images';
      if (this.currentView === 'categories') type = 'categories';
      else if (this.currentView === 'folders') type = 'folders';
      this.updateTotalCount(currentCount, type);
    }
  }

  updateLanguageDisplay() {
    const currentLang = window.i18n.getCurrentLanguage();
    const currentLanguageSpan = document.getElementById('currentLanguage');
    if (currentLanguageSpan) {
      currentLanguageSpan.textContent = currentLang === 'zh' ? '中' : 'EN';
    }
  }

  initializeElements() {
    this.galleryGrid = document.getElementById('galleryGrid');
    this.folderGrid = document.getElementById('folderGrid');
    this.categoryLayout = document.getElementById('categoryLayout');
    this.categorySidebar = document.getElementById('categorySidebar');
    this.categoryContent = document.getElementById('categoryContent');
    this.categoryList = document.getElementById('categoryList');
    this.itemsGrid = document.getElementById('itemsGrid');
    this.categoryHeader = document.getElementById('categoryHeader');
    this.selectedCategoryName = document.getElementById('selectedCategoryName');
    this.categoryItemCount = document.getElementById('categoryItemCount');
    this.categoryImageCount = document.getElementById('categoryImageCount');
    this.noCategorySelected = document.getElementById('noCategorySelected');
    this.loading = document.getElementById('loading');
    this.noResults = document.getElementById('noResults');
    this.searchInput = document.getElementById('searchInput');
    this.categorySearch = document.getElementById('categorySearch');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.totalCount = document.getElementById('totalCount');

    // View toggle elements
    this.categoryViewBtn = document.getElementById('categoryViewBtn');
    this.folderViewBtn = document.getElementById('folderViewBtn');
    this.gridViewBtn = document.getElementById('gridViewBtn');

    // Language selector elements
    this.languageBtn = document.getElementById('languageBtn');
    this.languageDropdown = document.getElementById('languageDropdown');
    this.currentLanguage = document.getElementById('currentLanguage');

    // Daemon elements
    this.daemonBtn = document.getElementById('daemonBtn');
    this.daemonStatus = document.getElementById('daemonStatus');
    this.daemonModal = document.getElementById('daemonModal');
    this.daemonModalOverlay = document.getElementById('daemonModalOverlay');
    this.daemonModalClose = document.getElementById('daemonModalClose');
    this.daemonStatusText = document.getElementById('daemonStatusText');
    this.daemonDirectory = document.getElementById('daemonDirectory');
    this.daemonQueue = document.getElementById('daemonQueue');
    this.indexEntries = document.getElementById('indexEntries');
    this.metadataCache = document.getElementById('metadataCache');
    this.startDaemonBtn = document.getElementById('startDaemonBtn');
    this.stopDaemonBtn = document.getElementById('stopDaemonBtn');
    this.generateAllBtn = document.getElementById('generateAllBtn');
    this.rebuildIndexBtn = document.getElementById('rebuildIndexBtn');

    // Lightbox elements
    this.lightbox = document.getElementById('lightbox');
    this.lightboxOverlay = document.getElementById('lightboxOverlay');
    this.lightboxClose = document.getElementById('lightboxClose');
    this.lightboxImage = document.getElementById('lightboxImage');
    this.lightboxPrev = document.getElementById('lightboxPrev');
    this.lightboxNext = document.getElementById('lightboxNext');
    this.lightboxInfo = document.getElementById('lightboxInfo');
    this.imageTitle = document.getElementById('imageTitle');
    this.imageSize = document.getElementById('imageSize');
    this.imageDimensions = document.getElementById('imageDimensions');
    this.imageFormat = document.getElementById('imageFormat');
    this.imageDirectory = document.getElementById('imageDirectory');
  }

  attachEventListeners() {
    // View toggle listeners
    this.categoryViewBtn.addEventListener('click', () =>
      this.switchToCategoryView()
    );
    this.folderViewBtn.addEventListener('click', () =>
      this.switchToFolderView()
    );
    this.gridViewBtn.addEventListener('click', () => this.switchToGridView());

    // Search functionality
    let searchTimeout;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchTerm = e.target.value.trim();
        this.resetGallery();
        this.loadImages();
      }, 300);
    });

    // Category search functionality
    let categorySearchTimeout;
    this.categorySearch.addEventListener('input', (e) => {
      clearTimeout(categorySearchTimeout);
      categorySearchTimeout = setTimeout(() => {
        this.categorySearchTerm = e.target.value.trim();
        this.filterCategories();
      }, 300);
    });

    // Refresh button
    this.refreshBtn.addEventListener('click', () => {
      this.refreshGallery();
    });

    // Language selector events
    this.languageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleLanguageDropdown();
    });

    // Close language dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeLanguageDropdown();
    });

    // Language option events
    document.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const lang = e.currentTarget.getAttribute('data-lang');
        this.changeLanguage(lang);
      });
    });

    // Daemon button
    this.daemonBtn.addEventListener('click', () => {
      this.openDaemonModal();
    });

    // Infinite scroll
    window.addEventListener('scroll', () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 1000
      ) {
        this.loadImages();
      }
    });

    // Daemon modal events
    this.daemonModalClose.addEventListener('click', () =>
      this.closeDaemonModal()
    );
    this.daemonModalOverlay.addEventListener('click', () =>
      this.closeDaemonModal()
    );
    this.startDaemonBtn.addEventListener('click', () =>
      this.controlDaemon('start')
    );
    this.stopDaemonBtn.addEventListener('click', () =>
      this.controlDaemon('stop')
    );
    this.generateAllBtn.addEventListener('click', () =>
      this.generateAllThumbnails()
    );
    this.rebuildIndexBtn.addEventListener('click', () => this.rebuildIndex());

    // Lightbox events
    this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    this.lightboxOverlay.addEventListener('click', () => this.closeLightbox());
    this.lightboxPrev.addEventListener('click', () => this.showPreviousImage());
    this.lightboxNext.addEventListener('click', () => this.showNextImage());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (this.lightbox.classList.contains('active')) {
        switch (e.key) {
          case 'Escape':
            this.closeLightbox();
            break;
          case 'ArrowLeft':
            this.showPreviousImage();
            break;
          case 'ArrowRight':
            this.showNextImage();
            break;
        }
      }
    });
  }

  loadContent() {
    if (this.currentView === 'categories') {
      this.loadCategories();
    } else if (this.currentView === 'folders') {
      this.loadFolders();
    } else {
      this.loadImages();
    }
  }

  async loadCategories() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.updateLoadingText('categories');
    this.showLoading();

    try {
      const response = await fetch('/api/categories');
      const data = await response.json();

      if (data.categories) {
        this.categories = data.categories;
        this.renderCategories(data.categories);
        this.updateTotalCount(data.totalCategories, 'categories');
      } else {
        this.showNoResults();
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      this.showError(window.i18n.t('error.loadCategories'));
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  renderCategories(categories) {
    this.categoryList.innerHTML = '';
    
    categories.forEach(category => {
      const listItem = document.createElement('li');
      listItem.className = 'category-item';
      
      const link = document.createElement('div');
      link.className = 'category-link';
      link.onclick = () => this.selectCategory(category);
      
      const itemText = window.i18n.formatCount(category.itemCount, 'items');
      const imageText = window.i18n.formatCount(category.imageCount, 'images');
      
      link.innerHTML = `
        <div class="category-name">${category.name}</div>
        <div class="category-stats">${itemText} • ${imageText}</div>
      `;
      
      listItem.appendChild(link);
      this.categoryList.appendChild(listItem);
    });
  }

  filterCategories() {
    const searchTerm = this.categorySearchTerm.toLowerCase();
    const filteredCategories = this.categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm)
    );
    this.renderCategories(filteredCategories);
  }

  async selectCategory(category) {
    // Update UI to show selected category
    document.querySelectorAll('.category-link').forEach(link => {
      link.classList.remove('active');
    });
    event.target.closest('.category-link').classList.add('active');

    this.selectedCategory = category;
    this.selectedCategoryName.textContent = category.name;
    this.categoryItemCount.textContent = window.i18n.formatCount(category.itemCount, 'items');
    this.categoryImageCount.textContent = window.i18n.formatCount(category.imageCount, 'images');
    this.categoryHeader.style.display = 'block';
    this.noCategorySelected.style.display = 'none';

    // Load items for this category
    await this.loadCategoryItems(category.path);
  }

  async loadCategoryItems(categoryPath) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.updateLoadingText('items');
    this.showLoading();

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(categoryPath)}/items`);
      const data = await response.json();

      if (data.items) {
        this.currentItems = data.items;
        this.renderItems(data.items);
      } else {
        this.itemsGrid.innerHTML = `<div class="no-results">${window.i18n.t('category.noItems')}</div>`;
      }
    } catch (error) {
      console.error('Error loading category items:', error);
      this.showError(window.i18n.t('error.loadItems'));
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  renderItems(items) {
    this.itemsGrid.innerHTML = '';
    
    items.forEach(item => {
      const itemElement = this.createItemElement(item);
      this.itemsGrid.appendChild(itemElement);
    });
  }

  createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.onclick = () => this.viewItemImages(item);
    
    const imageText = window.i18n.formatCount(item.imageCount, 'images');
    
    div.innerHTML = `
      <img class="item-thumbnail" src="${item.mainImage.thumbnail}" alt="${item.name}" loading="lazy">
      <div class="item-info">
        <h3 class="item-name">${item.name}</h3>
        <div class="item-stats">${imageText}</div>
      </div>
    `;
    
    return div;
  }

  async viewItemImages(item) {
    this.selectedItem = item;
    
    try {
      const response = await fetch(`/api/items/${encodeURIComponent(item.category)}/${encodeURIComponent(item.name)}/images`);
      const data = await response.json();

      if (data.images && data.images.length > 0) {
        this.images = data.images;
        this.currentImageIndex = 0;
        this.openLightbox(0);
      }
    } catch (error) {
      console.error('Error loading item images:', error);
      this.showError(window.i18n.t('error.loadImages'));
    }
  }

  async loadImages() {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.showLoading();

    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: 20,
        search: this.searchTerm,
      });

      const response = await fetch(`/api/images?${params}`);
      const data = await response.json();

      if (data.images && data.images.length > 0) {
        this.images.push(...data.images);
        this.renderImages(data.images);
        this.currentPage++;
        this.hasMore = data.hasMore;
      } else if (this.currentPage === 1) {
        this.showNoResults();
      }

      this.updateTotalCount(data.totalCount);
    } catch (error) {
      console.error('Error loading images:', error);
      this.showError(window.i18n.t('error.loadImages'));
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  renderImages(images) {
    const fragment = document.createDocumentFragment();

    images.forEach((image, index) => {
      const imageElement = this.createImageElement(
        image,
        this.images.length - images.length + index
      );
      fragment.appendChild(imageElement);
    });

    this.galleryGrid.appendChild(fragment);
  }

  createImageElement(image, index) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.style.animationDelay = `${(index % 20) * 50}ms`;

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    div.innerHTML = `
            <img class="gallery-item-image" src="${image.thumbnail}" alt="${
      image.metadata?.filename || 'Image'
    }" loading="lazy">
            <div class="gallery-item-info">
                <div class="gallery-item-title">${
                  image.metadata?.filename || 'Unknown'
                }</div>
                <div class="gallery-item-meta">
                    <span>${image.metadata?.width || '?'}×${
      image.metadata?.height || '?'
    }</span>
                    <span>${formatFileSize(image.metadata?.size || 0)}</span>
                </div>
                ${
                  image.directory && image.directory !== '/'
                    ? `<div class="gallery-item-directory">${image.directory}</div>`
                    : ''
                }
            </div>
        `;

    div.addEventListener('click', () => this.openLightbox(index));

    return div;
  }

  async openLightbox(imageIndex) {
    this.currentImageIndex = imageIndex;
    const image = this.images[imageIndex];

    if (!image) return;

    // Show lightbox
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Load full image data
    try {
      const response = await fetch(`/api/image/${image.id}`);
      const imageData = await response.json();

      // Update lightbox content
      this.lightboxImage.src = imageData.url;
      this.lightboxImage.alt = imageData.metadata?.filename || 'Image';

      // Update metadata
      this.updateLightboxInfo(imageData);
    } catch (error) {
      console.error('Error loading full image:', error);
      // Fallback to thumbnail
      this.lightboxImage.src = image.thumbnail;
      this.updateLightboxInfo(image);
    }

    // Update navigation buttons
    this.updateNavigationButtons();
  }

  updateLightboxInfo(imageData) {
    const metadata = imageData.metadata || {};

    this.imageTitle.textContent = metadata.filename || 'Unknown';
    this.imageSize.textContent = this.formatFileSize(metadata.size || 0);
    this.imageDimensions.textContent = `${metadata.width || '?'} × ${
      metadata.height || '?'
    } pixels`;
    this.imageFormat.textContent = (metadata.format || 'unknown').toUpperCase();
    this.imageDirectory.textContent = imageData.directory || '/';
  }

  closeLightbox() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  showPreviousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.openLightbox(this.currentImageIndex);
    }
  }

  showNextImage() {
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
      this.openLightbox(this.currentImageIndex);
    }
  }

  updateNavigationButtons() {
    this.lightboxPrev.disabled = this.currentImageIndex === 0;
    this.lightboxNext.disabled =
      this.currentImageIndex === this.images.length - 1;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  resetGallery() {
    this.currentPage = 1;
    this.hasMore = true;
    this.images = [];
    this.folders = [];
    this.categories = [];
    this.currentItems = [];
    this.galleryGrid.innerHTML = '';
    this.folderGrid.innerHTML = '';
    this.categoryList.innerHTML = '';
    this.itemsGrid.innerHTML = '';
    this.selectedCategory = null;
    this.selectedItem = null;
    this.hideNoResults();
  }

  async refreshGallery() {
    this.refreshBtn.style.transform = 'rotate(180deg)';

    try {
      // Call refresh API
      await fetch('/api/refresh', { method: 'POST' });

      // Reset and reload based on current view
      this.resetGallery();
      if (this.currentView === 'categories') {
        await this.loadCategories();
      } else if (this.currentView === 'folders') {
        await this.loadFolders();
      } else {
        await this.loadImages();
      }
    } catch (error) {
      console.error('Error refreshing gallery:', error);
      this.showError('Failed to refresh gallery');
    } finally {
      setTimeout(() => {
        this.refreshBtn.style.transform = '';
      }, 500);
    }
  }

  showLoading() {
    this.loading.style.display = 'block';
  }

  hideLoading() {
    this.loading.style.display = 'none';
  }

  showNoResults() {
    this.noResults.style.display = 'block';
  }

  hideNoResults() {
    this.noResults.style.display = 'none';
  }

  // Language methods
  toggleLanguageDropdown() {
    this.languageDropdown.classList.toggle('show');
  }

  closeLanguageDropdown() {
    this.languageDropdown.classList.remove('show');
  }

  changeLanguage(lang) {
    window.i18n.setLanguage(lang);
    this.closeLanguageDropdown();
  }

  // Update loading text based on current context
  updateLoadingText(context = 'images') {
    const loadingSpan = this.loading.querySelector('span');
    if (loadingSpan) {
      switch (context) {
        case 'categories':
          loadingSpan.textContent = window.i18n.t('loading.categories');
          break;
        case 'items':
          loadingSpan.textContent = window.i18n.t('loading.items');
          break;
        default:
          loadingSpan.textContent = window.i18n.t('loading.images');
      }
    }
  }

  // View switching methods
  switchToCategoryView() {
    this.currentView = 'categories';
    this.categoryViewBtn.classList.add('active');
    this.folderViewBtn.classList.remove('active');
    this.gridViewBtn.classList.remove('active');
    this.categoryLayout.style.display = 'flex';
    this.folderGrid.style.display = 'none';
    this.galleryGrid.style.display = 'none';
    this.resetGallery();
    this.loadCategories();
  }

  switchToFolderView() {
    this.currentView = 'folders';
    this.categoryViewBtn.classList.remove('active');
    this.folderViewBtn.classList.add('active');
    this.gridViewBtn.classList.remove('active');
    this.categoryLayout.style.display = 'none';
    this.folderGrid.style.display = 'grid';
    this.galleryGrid.style.display = 'none';
    this.resetGallery();
    this.loadFolders();
  }

  switchToGridView() {
    this.currentView = 'grid';
    this.categoryViewBtn.classList.remove('active');
    this.gridViewBtn.classList.add('active');
    this.folderViewBtn.classList.remove('active');
    this.categoryLayout.style.display = 'none';
    this.galleryGrid.style.display = 'grid';
    this.folderGrid.style.display = 'none';
    this.resetGallery();
    this.loadImages();
  }

  // Load folders for folder view
  async loadFolders() {
    this.showLoading();

    try {
      const response = await fetch('/api/folders');
      const data = await response.json();

      this.folders = data.folders || [];
      this.renderFolders();
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      this.hideLoading();
    }
  }

  renderFolders() {
    this.folderGrid.innerHTML = '';

    if (this.folders.length === 0) {
      this.showNoResults();
      return;
    }

    this.hideNoResults();

    this.folders.forEach((folder, index) => {
      const folderCard = this.createFolderCard(folder, index);
      this.folderGrid.appendChild(folderCard);
    });

    // Update count
    this.totalCount.textContent = `${this.folders.length} folder${
      this.folders.length !== 1 ? 's' : ''
    }`;
  }

  createFolderCard(folder, index) {
    const div = document.createElement('div');
    div.className = 'folder-card';
    div.style.animationDelay = `${index * 100}ms`;

    // Combine main image and additional images for slideshow
    const allImages = [folder.mainImage, ...folder.additionalImages];
    const slideshowImages = allImages.slice(0, 6); // Limit to 6 for slideshow

    let slideshowHtml = '';
    if (slideshowImages.length > 1) {
      slideshowHtml = `
                <div class="folder-slideshow">
                    <div class="slideshow-container">
                        <div class="slideshow-track" data-current="0">
                            ${slideshowImages
                              .map(
                                (img, imgIndex) => `
                                <div class="slideshow-slide ${
                                  imgIndex === 0 ? 'active' : ''
                                }" data-index="${imgIndex}">
                                    <img src="${img.thumbnail}" alt="${
                                  img.metadata?.filename || 'Image'
                                }" loading="lazy">
                                </div>
                            `
                              )
                              .join('')}
                        </div>
                        <div class="slideshow-controls">
                            <button class="slideshow-prev" onclick="event.stopPropagation(); slideShow(this, -1)">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="slideshow-next" onclick="event.stopPropagation(); slideShow(this, 1)">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="slideshow-counter">
                            <span class="current-slide">1</span>/<span class="total-slides">${
                              slideshowImages.length
                            }</span>
                        </div>
                    </div>
                </div>
            `;
    } else {
      // Single image, no slideshow needed
      slideshowHtml = `
                <div class="folder-main-image">
                    <img src="${folder.mainImage.thumbnail}" alt="${
        folder.mainImage.metadata?.filename || 'Main Image'
      }" loading="lazy">
                </div>
            `;
    }

    // Additional thumbnails row (up to 5, flex row)
    let additionalThumbsHtml = '';
    if (folder.additionalImages && folder.additionalImages.length > 0) {
      additionalThumbsHtml = `
                <div class="folder-thumbnails-row" >
                    ${folder.additionalImages
                      .map(
                        (img) => `
                        <img class="folder-thumbnail" src="${img.thumbnail}" alt="${img.filename}" title="${img.filename}" loading="lazy" >
                    `
                      )
                      .join('')}
                </div>
            `;
    }

    div.innerHTML = `
            ${slideshowHtml}
            <div class="folder-info">
                <div class="folder-name">${folder.displayName}</div>
                <div class="folder-count">${
                  folder.allImagesCount || folder.totalCount
                } image${
      (folder.allImagesCount || folder.totalCount) !== 1 ? 's' : ''
    }</div>
                ${additionalThumbsHtml}
            </div>
        `;

    div.addEventListener('click', () => this.openFolder(folder));
    return div;
  }

  openFolder(folder) {
    // Switch to grid view and filter by folder
    this.searchTerm = `dir="${folder.directory}"`;
    this.searchInput.value = this.searchTerm;
    this.switchToGridView();
  }

  updateTotalCount(count, type = 'images') {
    this.totalCount.textContent = window.i18n.formatCount(count, type);
  }

  showError(message) {
    // You could implement a toast notification system here
    console.error(message);
  }

  // Daemon functionality
  async updateDaemonStatus() {
    try {
      const response = await fetch('/api/daemon/status');
      const data = await response.json();

      // Update daemon status indicator
      if (data.isWatching) {
        this.daemonStatus.className = 'daemon-status active';
        this.daemonStatus.textContent = '●';
      } else {
        this.daemonStatus.className = 'daemon-status inactive';
        this.daemonStatus.textContent = '●';
      }

      // Update modal content if open
      if (this.daemonModal.classList.contains('active')) {
        this.daemonStatusText.textContent = data.isWatching
          ? window.i18n.t('daemon.status.running')
          : window.i18n.t('daemon.status.stopped');
        this.daemonDirectory.textContent = data.watchedDirectory;
        this.daemonQueue.textContent =
          data.processingQueue.length > 0
            ? data.processingQueue.join(', ')
            : window.i18n.t('daemon.queue.empty') || 'Empty';

        // Update index information
        if (data.thumbnailIndex) {
          this.indexEntries.textContent = `${data.thumbnailIndex.totalEntries} total`;
          this.metadataCache.textContent = `${data.thumbnailIndex.entriesWithMetadata} cached (${data.thumbnailIndex.cacheHitRate}%)`;
        } else {
          this.indexEntries.textContent = 'Unknown';
          this.metadataCache.textContent = 'Unknown';
        }

        this.startDaemonBtn.disabled = data.isWatching;
        this.stopDaemonBtn.disabled = !data.isWatching;
      }
    } catch (error) {
      console.error('Error updating daemon status:', error);
      this.daemonStatus.className = 'daemon-status inactive';
    }
  }

  openDaemonModal() {
    this.daemonModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.updateDaemonStatus();
  }

  closeDaemonModal() {
    this.daemonModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  async controlDaemon(action) {
    try {
      const response = await fetch(`/api/daemon/${action}`, { method: 'POST' });
      const data = await response.json();

      console.log(data.message);

      // Update status immediately
      setTimeout(() => {
        this.updateDaemonStatus();
      }, 500);
    } catch (error) {
      console.error(`Error ${action}ing daemon:`, error);
      this.showError(`Failed to ${action} daemon`);
    }
  }

  async generateAllThumbnails() {
    try {
      this.generateAllBtn.disabled = true;
      this.generateAllBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Generating...';

      const response = await fetch('/api/daemon/generate-all', {
        method: 'POST',
      });
      const data = await response.json();

      console.log(data.message);

      // Reset button after a delay
      setTimeout(() => {
        this.generateAllBtn.disabled = false;
        this.generateAllBtn.innerHTML =
          '<i class="fas fa-images"></i> Generate All Thumbnails';
      }, 2000);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      this.showError('Failed to generate thumbnails');
      this.generateAllBtn.disabled = false;
      this.generateAllBtn.innerHTML =
        '<i class="fas fa-images"></i> Generate All Thumbnails';
    }
  }

  async rebuildIndex() {
    try {
      this.rebuildIndexBtn.disabled = true;
      this.rebuildIndexBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Rebuilding...';

      const response = await fetch('/api/daemon/rebuild-index', {
        method: 'POST',
      });
      const data = await response.json();

      console.log(data.message);

      // Update status immediately
      setTimeout(() => {
        this.updateDaemonStatus();
      }, 500);

      // Reset button after a delay
      setTimeout(() => {
        this.rebuildIndexBtn.disabled = false;
        this.rebuildIndexBtn.innerHTML =
          '<i class="fas fa-database"></i> Rebuild Index';
      }, 2000);
    } catch (error) {
      console.error('Error rebuilding index:', error);
      this.showError('Failed to rebuild index');
      this.rebuildIndexBtn.disabled = false;
      this.rebuildIndexBtn.innerHTML =
        '<i class="fas fa-database"></i> Rebuild Index';
    }
  }
}

// Global slideshow function
function slideShow(button, direction) {
  const slideshow = button.closest('.folder-slideshow');
  const track = slideshow.querySelector('.slideshow-track');
  const slides = slideshow.querySelectorAll('.slideshow-slide');
  const counter = slideshow.querySelector('.slideshow-counter');
  const currentSlideSpan = counter.querySelector('.current-slide');

  let currentIndex = parseInt(track.dataset.current);
  const totalSlides = slides.length;

  // Calculate new index
  currentIndex += direction;
  if (currentIndex < 0) currentIndex = totalSlides - 1;
  if (currentIndex >= totalSlides) currentIndex = 0;

  // Update slides
  slides.forEach((slide, index) => {
    slide.classList.remove('active', 'prev', 'next');
    if (index === currentIndex) {
      slide.classList.add('active');
    }
  });

  // Update counter
  currentSlideSpan.textContent = currentIndex + 1;
  track.dataset.current = currentIndex;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GalleryApp();
});
