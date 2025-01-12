document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.default-content-wrapper');
  if (wrapper) {
    const author = document.createElement('div');
    author.className = 'author';
    author.textContent = 'Doug Hatcher';

    const updated = document.createElement('div');
    updated.className = 'updated';
    const lastModified = new Date(document.lastModified);
    updated.textContent = `Updated ${lastModified.toLocaleDateString()}`;

    const originalSource = document.createElement('div');
    originalSource.className = 'original-source';

    const metaTag = document.querySelector('meta[name="original-source"]');
    if (metaTag) {
      const link = document.createElement('a');
      link.href = metaTag.content;
      link.target = '_blank';
      link.textContent = 'Original Source';
      originalSource.appendChild(link);
      wrapper.insertAdjacentElement('afterbegin', originalSource);
    }

    wrapper.insertAdjacentElement('afterbegin', updated);
    wrapper.insertAdjacentElement('afterbegin', author);
  }
});
