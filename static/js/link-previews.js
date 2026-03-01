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

  // Function to check if URL is a Reddit post
  function isRedditUrl(url) {
    const domain = getDomain(url);
    return domain.includes('reddit.com') || domain.includes('redd.it');
  }

  // Extract a human-readable title from a Reddit URL slug
  // e.g. /r/sub/comments/abc123/my_cool_post/ → "my cool post"
  function getRedditTitleFromUrl(url) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      const commentsIdx = parts.indexOf('comments');
      if (commentsIdx !== -1 && parts[commentsIdx + 2]) {
        return decodeURIComponent(parts[commentsIdx + 2]).replace(/_/g, ' ');
      }
    } catch (e) {}
    return null;
  }

  // Use Reddit's public JSON API to build a proper post card.
  // Returns a DOM element on success, null on failure (caller falls back to generic preview card).
  async function createRedditEmbed(link) {
    const url = link.href;
    try {
      // Reddit serves JSON for any post by appending .json
      const jsonUrl = url.replace(/\/?(\?.*)?$/, '.json$1');
      const res = await fetch(jsonUrl, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Reddit JSON ' + res.status);
      const data = await res.json();

      const post = data[0]?.data?.children?.[0]?.data;
      if (!post) throw new Error('no post data');

      const title = post.title || getRedditTitleFromUrl(url) || 'Reddit post';
      const subreddit = post.subreddit ? `r/${post.subreddit}` : 'reddit.com';
      const isVideo = post.is_video;

      // Prefer the highest-res preview image; fall back to thumbnail
      const badThumbnails = new Set(['self', 'default', 'nsfw', 'spoiler', 'image', '']);
      const previewImg = post.preview?.images?.[0]?.resolutions?.slice(-1)[0]?.url?.replace(/&amp;/g, '&')
        || post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&')
        || null;
      const thumbImg = post.thumbnail && !badThumbnails.has(post.thumbnail) ? post.thumbnail : null;
      const image = previewImg || thumbImg;

      const card = document.createElement('a');
      card.href = url;
      card.className = 'link-preview-card reddit-preview';
      card.target = '_blank';
      card.rel = 'noopener';

      let html = '';
      if (image) {
        html += `
          <div class="link-preview-image">
            ${isVideo ? '<div class="reddit-play-badge">▶</div>' : ''}
            <img src="${image}" alt="${title}" loading="lazy" onerror="this.parentElement.style.display='none'">
          </div>`;
      }
      html += `
        <div class="link-preview-content">
          <div class="link-preview-title">${title}</div>
          <div class="link-preview-url">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            ${subreddit}
          </div>
        </div>`;
      card.innerHTML = html;
      return card;
    } catch (e) {
      console.warn('Reddit JSON API failed, using preview card fallback:', e);
      return null;
    }
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
    card.className = isRedditUrl(url) ? 'link-preview-card reddit-preview' : 'link-preview-card';
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
          console.log('Processing link:', link.href);
          linkCount++;
          
          // Add loading indicator
          p.classList.add('link-preview-loading');
          
          try {
            const url = link.href;
            
            // Check if it's a YouTube URL
            if (isYouTubeUrl(url)) {
              const videoId = getYouTubeId(url);
              if (videoId) {
                console.log('Creating YouTube embed for:', videoId);
                const embed = createYouTubeEmbed(link, videoId);

                // If there's text before the link, preserve it
                if (isTrailingLink) {
                  const textBefore = textContent.substring(0, textContent.length - linkText.length).trim();
                  const textP = document.createElement('p');
                  textP.textContent = textBefore;

                  // Replace paragraph with text and embed
                  p.replaceWith(textP, embed);
                } else {
                  // Just replace with embed
                  p.replaceWith(embed);
                }
                continue;
              }
            }

            // Reddit: use native oEmbed embed so video and images render properly
            if (isRedditUrl(url)) {
              const embed = await createRedditEmbed(link);
              if (embed) {
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
              // oEmbed failed — fall through to preview card with fixed metadata
            }

            // Fetch metadata for other links
            const metadata = await fetchMetadata(url);

            // Reddit fallback: fix a hash-like title with the URL slug, and
            // never show the Reddit brand/logo image (redditstatic.com) as the post image.
            if (isRedditUrl(url)) {
              const looksLikeHash = !metadata.title || /^[A-Za-z0-9_-]{6,20}$/.test(metadata.title.trim());
              if (looksLikeHash) {
                metadata.title = getRedditTitleFromUrl(url) || 'Reddit post';
              }
              if (metadata.image && metadata.image.includes('redditstatic.com')) {
                metadata.image = null;
              }
            }

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


