// Link Preview Generator - With metadata fetching
(function() {
  'use strict';

  console.log('Link preview script loaded');

  // Function to extract domain from URL
  function getDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return '';
    }
  }

  // Function to create preview card with metadata
  function createPreviewCard(link, metadata) {
    const url = link.href;
    const domain = getDomain(url);
    
    const card = document.createElement('a');
    card.href = url;
    card.className = 'link-preview-card';
    card.target = '_blank';
    card.rel = 'noopener';
    
    let html = '';
    
    // Add image if available
    if (metadata.image) {
      html += `
        <div class="link-preview-image">
          <img src="${metadata.image}" alt="${metadata.title || domain}" loading="lazy" onerror="this.parentElement.remove()">
        </div>
      `;
    }
    
    html += `
      <div class="link-preview-content">
        <div class="link-preview-title">${metadata.title || domain}</div>
        ${metadata.description ? `<div class="link-preview-description">${metadata.description}</div>` : ''}
        <div class="link-preview-url">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          ${domain}
        </div>
      </div>
    `;
    
    card.innerHTML = html;
    return card;
  }

  // Fetch link metadata using LinkPreview API
  async function fetchMetadata(url) {
    try {
      // Using microlink.io API - reliable and has good free tier
      const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        return {
          title: data.data.title || getDomain(url),
          description: data.data.description || '',
          image: data.data.image?.url || data.data.logo?.url || null
        };
      }
    } catch (error) {
      console.error('Metadata fetch failed:', error);
    }
    
    // Fallback metadata
    return {
      title: getDomain(url),
      description: url,
      image: null
    };
  }

  // Find all standalone links in post bodies and convert to preview cards
  async function enhanceLinks() {
    console.log('Enhancing links...');
    const postBodies = document.querySelectorAll('.post-body, .post-content');
    console.log('Found', postBodies.length, 'post bodies/content areas');
    
    let linkCount = 0;
    
    for (const body of postBodies) {
      const paragraphs = body.querySelectorAll('p');
      
      for (const p of paragraphs) {
        // Check if paragraph contains a link
        const links = p.querySelectorAll('a[href^="http"]');
        
        if (links.length !== 1) continue;
        
        const link = links[0];
        
        // Skip if paragraph has images
        if (p.querySelector('img')) continue;
        
        const textContent = p.textContent.trim();
        const linkText = link.textContent.trim();
        
        // Check if link is standalone OR if it's at the end with text before it
        // Also handle cases where the link might be truncated with ellipsis
        const isStandalone = textContent === linkText || 
                            (textContent === linkText + '…' || textContent === linkText + '...');
        const isTrailingLink = (textContent.endsWith(linkText) || 
                               textContent.endsWith(linkText + '…') ||
                               textContent.endsWith(linkText + '...')) && 
                              textContent.length > linkText.length;
        
        if (isStandalone || isTrailingLink) {
          console.log('Fetching preview for:', link.href);
          linkCount++;
          
          // Add loading indicator
          p.classList.add('link-preview-loading');
          
          try {
            // Fetch metadata
            const metadata = await fetchMetadata(link.href);
            const card = createPreviewCard(link, metadata);
            
            // If there's text before the link, preserve it
            if (isTrailingLink) {
              const textBefore = textContent.substring(0, textContent.length - linkText.length).trim();
              const textP = document.createElement('p');
              textP.textContent = textBefore;
              
              // Replace paragraph with text and card
              p.replaceWith(textP, card);
            } else {
              // Just replace with card
              p.replaceWith(card);
            }
          } catch (error) {
            console.error('Failed to create preview card:', error);
            p.classList.remove('link-preview-loading');
          }
        }
      }
    }
    
    console.log('Enhanced', linkCount, 'links');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceLinks);
  } else {
    enhanceLinks();
  }
})();


