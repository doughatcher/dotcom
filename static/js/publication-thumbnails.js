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
                // ONLY use og:image - don't fall back to logo or screenshot
                // Those tend to be low quality or full page screenshots
                const imageUrl = data.data.image?.url;
                
                if (!imageUrl) {
                    console.log(`No og:image found for ${url}`);
                    return null;
                }
                
                // Validate image quality - reject if it looks like it might be a screenshot
                const imageData = data.data.image;
                if (imageData) {
                    // Reject images that are too wide (likely full page screenshots)
                    if (imageData.width > 2000 || imageData.height > 2000) {
                        console.log(`Rejecting oversized image for ${url}: ${imageData.width}x${imageData.height}`);
                        return null;
                    }
                }
                
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
            // Get the publication link first
            const link = item.querySelector('.publication-title a, .publication-sidebar-title a');
            if (!link) continue;

            const url = link.getAttribute('href');
            if (!url) continue;

            // Check if item has a Micro.blog generated thumbnail (these are screenshot-style)
            const existingThumbnail = item.querySelector('.publication-thumbnail img, .publication-sidebar-thumbnail img');
            if (existingThumbnail && existingThumbnail.src) {
                // Replace Micro.blog thumbnails with better images
                const isMicroBlogThumbnail = existingThumbnail.src.includes('micro.blog/thumbnails') || 
                                            existingThumbnail.src.includes('s3.amazonaws.com/micro.blog/thumbnails');
                
                if (!isMicroBlogThumbnail && existingThumbnail.src.startsWith('http')) {
                    // Skip if it's already a custom thumbnail (not from Micro.blog)
                    console.log('Skipping item - already has custom thumbnail:', existingThumbnail.src);
                    continue;
                }
                
                console.log('Will replace Micro.blog thumbnail for:', url);
            }

            // Determine if this is an internal or external URL
            const isExternal = url.startsWith('http') && !url.includes(window.location.hostname);
            
            if (isExternal) {
                // For external URLs, fetch og:image
                console.log(`Fetching og:image for external URL: ${url}`);
                
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
            } else {
                // For internal URLs, fetch the page and extract the first image
                console.log(`Fetching first image from internal post: ${url}`);
                
                item.classList.add('thumbnail-loading');
                
                try {
                    const response = await fetch(url);
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Find the first image in the post content
                    const postImage = doc.querySelector('.post-body img, .post-content img');
                    
                    if (postImage && postImage.src) {
                        const thumbnailData = {
                            image: postImage.src,
                            title: link.textContent.trim(),
                            description: null
                        };
                        updatePublicationThumbnail(item, thumbnailData);
                        console.log('Updated internal post thumbnail with:', postImage.src);
                    }
                } catch (error) {
                    console.error('Error fetching internal post:', error);
                } finally {
                    item.classList.remove('thumbnail-loading');
                }
            }
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhancePublications);
    } else {
        enhancePublications();
    }
})();
