/**
 * Publication Thumbnail Enhancement
 * Fetches Open Graph images from external publication URLs
 */

(function() {
    'use strict';

    /**
     * Fetch metadata (including og:image) from a URL using Microlink API
     */
    async function fetchThumbnail(url) {
        try {
            const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false&video=false`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                console.warn(`Failed to fetch thumbnail for ${url}:`, response.status);
                return null;
            }
            
            const data = await response.json();
            
            if (data.status === 'success' && data.data) {
                // Try to get the best image available
                const imageUrl = data.data.image?.url || 
                               data.data.logo?.url || 
                               data.data.screenshot?.url;
                
                return {
                    image: imageUrl,
                    title: data.data.title,
                    description: data.data.description
                };
            }
            
            return null;
        } catch (error) {
            console.error(`Error fetching thumbnail for ${url}:`, error);
            return null;
        }
    }

    /**
     * Update publication item with fetched thumbnail
     */
    function updatePublicationThumbnail(item, thumbnailData) {
        if (!thumbnailData || !thumbnailData.image) return;

        const link = item.querySelector('.publication-title a, .publication-sidebar-title a');
        if (!link) return;

        const url = link.getAttribute('href');
        const title = link.textContent.trim();

        // Check if thumbnail already exists
        let thumbnailContainer = item.querySelector('.publication-thumbnail, .publication-sidebar-thumbnail');
        
        if (!thumbnailContainer) {
            // Create thumbnail container
            const isSidebar = item.classList.contains('publication-sidebar-item');
            thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = isSidebar ? 'publication-sidebar-thumbnail' : 'publication-thumbnail';
            
            // Insert before content wrapper
            const contentWrapper = item.querySelector('.publication-content-wrapper, .publication-sidebar-content');
            if (contentWrapper) {
                item.insertBefore(thumbnailContainer, contentWrapper);
            } else {
                item.insertBefore(thumbnailContainer, item.firstChild);
            }
        }

        // Create or update thumbnail link and image
        let thumbnailLink = thumbnailContainer.querySelector('a');
        if (!thumbnailLink) {
            thumbnailLink = document.createElement('a');
            thumbnailLink.href = url;
            
            // Check if it's an external link
            const isExternal = url.startsWith('http') && !url.includes(window.location.hostname);
            if (isExternal) {
                thumbnailLink.target = '_blank';
                thumbnailLink.rel = 'noopener noreferrer';
            }
            
            thumbnailContainer.appendChild(thumbnailLink);
        }

        let img = thumbnailLink.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            img.alt = title;
            img.loading = 'lazy';
            thumbnailLink.appendChild(img);
        }

        // Update image source
        img.src = thumbnailData.image;
        
        // Add loaded class for animation
        thumbnailContainer.classList.add('thumbnail-loaded');
    }

    /**
     * Process all publication items without thumbnails
     */
    async function enhancePublications() {
        // Find publication items that might need thumbnails
        const publicationItems = document.querySelectorAll('.publication-item, .publication-sidebar-item');
        
        for (const item of publicationItems) {
            // Check if item already has a thumbnail with a valid src
            const existingThumbnail = item.querySelector('.publication-thumbnail img, .publication-sidebar-thumbnail img');
            if (existingThumbnail && existingThumbnail.src && existingThumbnail.src.startsWith('http')) {
                // Skip if already has a thumbnail - don't replace existing images
                console.log('Skipping item - already has thumbnail:', existingThumbnail.src);
                continue;
            }

            // Get the publication link
            const link = item.querySelector('.publication-title a, .publication-sidebar-title a');
            if (!link) continue;

            const url = link.getAttribute('href');
            
            // Only fetch for external URLs
            if (!url || !url.startsWith('http') || url.includes(window.location.hostname)) {
                continue;
            }

            // Check if this is a short post that links externally
            const isShortPost = item.dataset.contentLength && parseInt(item.dataset.contentLength) < 300;
            
            console.log(`Fetching thumbnail for: ${url}`);
            
            // Add loading state
            item.classList.add('thumbnail-loading');
            
            try {
                const thumbnailData = await fetchThumbnail(url);
                
                if (thumbnailData) {
                    updatePublicationThumbnail(item, thumbnailData);
                }
            } catch (error) {
                console.error('Error updating thumbnail:', error);
            } finally {
                item.classList.remove('thumbnail-loading');
            }
            
            // Add small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhancePublications);
    } else {
        enhancePublications();
    }
})();
