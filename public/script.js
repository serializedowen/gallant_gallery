class GalleryApp {
    constructor() {
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.searchTerm = '';
        this.images = [];
        this.folders = [];
        this.currentImageIndex = 0;
        this.currentView = 'folders'; // 'folders' or 'grid'
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadContent();
        this.updateDaemonStatus();
        
        // Update daemon status periodically
        setInterval(() => {
            this.updateDaemonStatus();
        }, 5000);
    }
    
    initializeElements() {
        this.galleryGrid = document.getElementById('galleryGrid');
        this.folderGrid = document.getElementById('folderGrid');
        this.loading = document.getElementById('loading');
        this.noResults = document.getElementById('noResults');
        this.searchInput = document.getElementById('searchInput');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.totalCount = document.getElementById('totalCount');
        
        // View toggle elements
        this.folderViewBtn = document.getElementById('folderViewBtn');
        this.gridViewBtn = document.getElementById('gridViewBtn');
        
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
        this.folderViewBtn.addEventListener('click', () => this.switchToFolderView());
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
        
        // Refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.refreshGallery();
        });
        
        // Daemon button
        this.daemonBtn.addEventListener('click', () => {
            this.openDaemonModal();
        });
        
        // Infinite scroll
        window.addEventListener('scroll', () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
                this.loadImages();
            }
        });
        
        // Daemon modal events
        this.daemonModalClose.addEventListener('click', () => this.closeDaemonModal());
        this.daemonModalOverlay.addEventListener('click', () => this.closeDaemonModal());
        this.startDaemonBtn.addEventListener('click', () => this.controlDaemon('start'));
        this.stopDaemonBtn.addEventListener('click', () => this.controlDaemon('stop'));
        this.generateAllBtn.addEventListener('click', () => this.generateAllThumbnails());
        this.rebuildIndexBtn.addEventListener('click', () => this.rebuildIndex());
        
        // Lightbox events
        this.lightboxClose.addEventListener('click', () => this.closeLightbox());
        this.lightboxOverlay.addEventListener('click', () => this.closeLightbox());
        this.lightboxPrev.addEventListener('click', () => this.showPreviousImage());
        this.lightboxNext.addEventListener('click', () => this.showNextImage());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.lightbox.classList.contains('active')) {
                switch(e.key) {
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
        if (this.currentView === 'folders') {
            this.loadFolders();
        } else {
            this.loadImages();
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
                search: this.searchTerm
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
            this.showError('Failed to load images');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    renderImages(images) {
        const fragment = document.createDocumentFragment();
        
        images.forEach((image, index) => {
            const imageElement = this.createImageElement(image, this.images.length - images.length + index);
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
            <img class="gallery-item-image" src="${image.thumbnail}" alt="${image.metadata?.filename || 'Image'}" loading="lazy">
            <div class="gallery-item-info">
                <div class="gallery-item-title">${image.metadata?.filename || 'Unknown'}</div>
                <div class="gallery-item-meta">
                    <span>${image.metadata?.width || '?'}×${image.metadata?.height || '?'}</span>
                    <span>${formatFileSize(image.metadata?.size || 0)}</span>
                </div>
                ${image.directory && image.directory !== '/' ? `<div class="gallery-item-directory">${image.directory}</div>` : ''}
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
        this.imageDimensions.textContent = `${metadata.width || '?'} × ${metadata.height || '?'} pixels`;
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
        this.lightboxNext.disabled = this.currentImageIndex === this.images.length - 1;
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
        this.galleryGrid.innerHTML = '';
        this.folderGrid.innerHTML = '';
        this.hideNoResults();
    }
    
    resetGallery() {
        this.currentPage = 1;
        this.hasMore = true;
        this.images = [];
        this.galleryGrid.innerHTML = '';
        this.hideNoResults();
    }
    
    async refreshGallery() {
        this.refreshBtn.style.transform = 'rotate(180deg)';
        
        try {
            // Call refresh API
            await fetch('/api/refresh', { method: 'POST' });
            
            // Reset and reload based on current view
            this.resetGallery();
            if (this.currentView === 'folders') {
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
    
    // View switching methods
    switchToFolderView() {
        this.currentView = 'folders';
        this.folderViewBtn.classList.add('active');
        this.gridViewBtn.classList.remove('active');
        this.folderGrid.style.display = 'grid';
        this.galleryGrid.style.display = 'none';
        this.resetGallery();
        this.loadFolders();
    }
    
    switchToGridView() {
        this.currentView = 'grid';
        this.gridViewBtn.classList.add('active');
        this.folderViewBtn.classList.remove('active');
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
        this.totalCount.textContent = `${this.folders.length} folder${this.folders.length !== 1 ? 's' : ''}`;
    }
    
    createFolderCard(folder, index) {
        const div = document.createElement('div');
        div.className = 'folder-card';

        div.style.animationDelay = `${index * 100}ms`;
        
        let additionalImagesHtml = '';
        if (folder.additionalImages && folder.additionalImages.length > 0) {
            additionalImagesHtml = `
                <div class="folder-additional-images">
                    ${folder.additionalImages.map(img => `
                        <img src="${img.thumbnail}" alt="${img.metadata?.filename || 'Image'}" loading="lazy">
                    `).join('')}
                </div>
            `;
        }
        
        div.innerHTML = `
            <div class="folder-main-image">
                <img src="${folder.mainImage.thumbnail}" alt="${folder.mainImage.metadata?.filename || 'Main Image'}" loading="lazy">
            </div>
            ${additionalImagesHtml}
            <div class="folder-info">
                <div class="folder-name">${folder.displayName}</div>
                <div class="folder-count">${folder.totalCount} image${folder.totalCount !== 1 ? 's' : ''}</div>
            </div>
        `;

        console.log(folder)
        
        div.addEventListener('click', () => this.openFolder(folder));
        
        return div;
    }
    
    openFolder(folder) {
        // Switch to grid view and filter by folder
        this.searchTerm = `dir="${folder.directory}"`;
        this.searchInput.value = this.searchTerm;
        this.switchToGridView();
    }

    updateTotalCount(count) {
        this.totalCount.textContent = `${count} image${count !== 1 ? 's' : ''}`;
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
                this.daemonStatusText.textContent = data.isWatching ? 'Active' : 'Inactive';
                this.daemonDirectory.textContent = data.watchedDirectory;
                this.daemonQueue.textContent = data.processingQueue.length > 0 
                    ? data.processingQueue.join(', ') 
                    : 'Empty';
                
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
            this.generateAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            const response = await fetch('/api/daemon/generate-all', { method: 'POST' });
            const data = await response.json();
            
            console.log(data.message);
            
            // Reset button after a delay
            setTimeout(() => {
                this.generateAllBtn.disabled = false;
                this.generateAllBtn.innerHTML = '<i class="fas fa-images"></i> Generate All Thumbnails';
            }, 2000);
            
        } catch (error) {
            console.error('Error generating thumbnails:', error);
            this.showError('Failed to generate thumbnails');
            this.generateAllBtn.disabled = false;
            this.generateAllBtn.innerHTML = '<i class="fas fa-images"></i> Generate All Thumbnails';
        }
    }
    
    async rebuildIndex() {
        try {
            this.rebuildIndexBtn.disabled = true;
            this.rebuildIndexBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rebuilding...';
            
            const response = await fetch('/api/daemon/rebuild-index', { method: 'POST' });
            const data = await response.json();
            
            console.log(data.message);
            
            // Update status immediately
            setTimeout(() => {
                this.updateDaemonStatus();
            }, 500);
            
            // Reset button after a delay
            setTimeout(() => {
                this.rebuildIndexBtn.disabled = false;
                this.rebuildIndexBtn.innerHTML = '<i class="fas fa-database"></i> Rebuild Index';
            }, 2000);
            
        } catch (error) {
            console.error('Error rebuilding index:', error);
            this.showError('Failed to rebuild index');
            this.rebuildIndexBtn.disabled = false;
            this.rebuildIndexBtn.innerHTML = '<i class="fas fa-database"></i> Rebuild Index';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GalleryApp();
});