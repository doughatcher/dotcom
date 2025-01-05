document.addEventListener('DOMContentLoaded', () => {
  const metaTag = document.querySelector('meta[name="original-source"]');
  if (metaTag) {
    const url = metaTag.getAttribute('content');
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.target = '_blank';
    linkElement.classList.add('btn');
    linkElement.textContent = 'Read More...';
    document.querySelector('.default-content-wrapper').appendChild(linkElement);
  }
});
