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

  // Function to extract YouTube video ID
  function getYouTubeId(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  // Function to check if URL is a YouTube video
  function isYouTubeUrl(url) {
    const domain = getDomain(url);
    return domain.includes('youtube.com') || domain.includes('youtu.be');
  }

  // Function to check if URL is a Reddit URL
  function isRedditUrl(url) {
    const domain = getDomain(url);
    return domain.includes('reddit.com');
  }

  // Function to create YouTube embed
  function createYouTubeEmbed(link, videoId) {
    const container = document.createElement('div');
    container.className = 'youtube-embed-container';
    container.innerHTML = `
      <iframe 
        src="https://www.youtube-nocookie.com/embed/${videoId}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
      ></iframe>
    `;
    return container;
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
      // For Reddit URLs, try to get JSON data first
      if (isRedditUrl(url)) {
        try {
          // Reddit share URLs need special handling - fetch and follow redirect
          let redditJsonUrl = url;
          
          // If it's a share URL, we need to fetch it first to get the real URL
          if (url.includes('/s/')) {
            console.log('Detected Reddit share URL, fetching actual post URL...');
            // Use a CORS proxy or let the microlink API handle it
            const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=false&screenshot=false&video=false`;
            const redirectResponse = await fetch(microlinkUrl);
            if (redirectResponse.ok) {
              const redirectData = await redirectResponse.json();
              if (redirectData.status === 'success' && redirectData.data.url) {
                redditJsonUrl = redirectData.data.url;
                console.log('Resolved Reddit URL to:', redditJsonUrl);
              }
            }
          }
          
          // Try to get Reddit JSON data
          const jsonUrl = redditJsonUrl.endsWith('/') ? redditJsonUrl + '.json' : redditJsonUrl + '.json';
          console.log('Fetching Reddit JSON from:', jsonUrl);
          
          const redditResponse = await fetch(jsonUrl);
          
          if (redditResponse.ok) {
            const redditData = await redditResponse.json();
            console.log('Reddit JSON data:', redditData);
            
            // Extract post data from Reddit JSON
            if (redditData && redditData[0] && redditData[0].data && redditData[0].data.children) {
              const post = redditData[0].data.children[0].data;
              
              // Get the best quality image
              let image = null;
              if (post.preview && post.preview.images && post.preview.images[0]) {
                // Use the highest resolution image available
                const images = post.preview.images[0];
                if (images.source && images.source.url) {
                  image = images.source.url.replace(/&amp;/g, '&');
                } else if (images.resolutions && images.resolutions.length > 0) {
                  const highRes = images.resolutions[images.resolutions.length - 1];
                  image = highRes.url.replace(/&amp;/g, '&');
                }
              } else if (post.thumbnail && post.thumbnail.startsWith('http')) {
                image = post.thumbnail;
              }
              
              return {
                title: post.title || getDomain(url),
                description: post.selftext ? post.selftext.substring(0, 300) : '',
                image: image
              };
            }
          }
        } catch (redditError) {
          console.log('Reddit JSON fetch failed, falling back to microlink:', redditError);
        }
      }
      
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
    const postBodies = document.querySelectorAll('.post-body, .post-content, .e-content');
    console.log('Found', postBodies.length, 'post bodies/content areas');
    
    let linkCount = 0;
    
    for (const body of postBodies) {
      const paragraphs = body.querySelectorAll('p');
      
      for (const p of paragraphs) {
        // Check if paragraph contains a link
        const links = p.querySelectorAll('a[href^="http"]');
        
        if (links.length !== 1) continue;
        
        const link = links[0];
        
        // Skip if paragraph has images (but not if it's inside a link preview card)
        if (p.querySelector('img') && !link.classList.contains('link-preview-card')) continue;
        
        // For existing link-preview-cards, only re-process if it's a Reddit URL with poor metadata
        const isExistingCard = link.classList.contains('link-preview-card');
        if (isExistingCard) {
          // Check if it's a Reddit link with poor metadata (title is just the share code)
          if (isRedditUrl(link.href)) {
            const titleEl = link.querySelector('.link-preview-title');
            if (titleEl && titleEl.textContent.match(/^[A-Za-z0-9]+$/)) {
              console.log('Re-processing poor Reddit preview:', link.href);
              // Continue to re-process this card
            } else {
              continue; // Skip if it already has good metadata
            }
          } else {
            continue; // Skip non-Reddit cards that already exist
          }
        }
        
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
          console.log('Processing link:', link.href);
          linkCount++;
          
          // Add loading indicator
          p.classList.add('link-preview-loading');
          
          try {
            // Check if it's a YouTube URL (use actual href, not text)
            if (isYouTubeUrl(link.href)) {
              const videoId = getYouTubeId(link.href);
              if (videoId) {
                console.log('Creating YouTube embed for:', videoId);
                const embed = createYouTubeEmbed(link, videoId);
                
                // If there's text before the link, preserve it
                if (isTrailingLink) {
                  const textBefore = textContent.substring(0, textContent.length - linkText.length).trim();
                  const textP = document.createElement('p');
                  textP.textContent = textBefore;
                  p.replaceWith(textP, embed);
                } else {
                  p.replaceWith(embed);
                }
                continue;
              }
            }
            
            // Fetch metadata for other URLs (use actual href)
            const metadata = await fetchMetadata(link.href);
            console.log('Fetched metadata:', metadata);
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


