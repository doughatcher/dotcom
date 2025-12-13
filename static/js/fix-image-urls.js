/**
 * Fix Image URLs
 * Converts local uploads/ paths to Micro.blog CDN URLs
 */

(function() {
    'use strict';

    // Your Micro.blog user ID (from the CDN URL pattern)
    const MICROBLOG_USER_ID = '264500';
    
    function fixImageUrls() {
        // Find all images with uploads/ in their src
        const images = document.querySelectorAll('img[src^="uploads/"]');
        
        console.log(`Found ${images.length} images with uploads/ paths`);
        
        images.forEach(img => {
            const originalSrc = img.getAttribute('src');
            // Convert uploads/2025/img-0098.jpg to https://cdn.uploads.micro.blog/264500/2025/img-0098.jpg
            const newSrc = originalSrc.replace(/^uploads\//, `https://cdn.uploads.micro.blog/${MICROBLOG_USER_ID}/`);
            
            console.log(`Fixing image URL: ${originalSrc} -> ${newSrc}`);
            img.setAttribute('src', newSrc);
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixImageUrls);
    } else {
        fixImageUrls();
    }
})();
