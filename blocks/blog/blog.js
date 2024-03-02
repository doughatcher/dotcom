import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    let blogUrl = ''; // Initialize a variable to store the blog URL
    while (row.firstElementChild) {
      const child = row.firstElementChild;
      // Check if the child is a blog URL
      if (child.children.length === 1 && child.querySelector('picture')) {
        child.className = 'blogs-blog-image';
      }
      if (child.innerHTML.charAt(0) === '/') {
        child.className = 'blogs-blog-url';
        blogUrl = child.textContent; // Store the blog URL
        child.style.display = 'none'; // Hide the blog URL element
      } else {
        child.className = 'blogs-blog-body';
      }
      li.append(child); // Append the child to the li element
    }

    // Wrap image and body in a link if blogUrl is not empty
    if (blogUrl) {
      [...li.querySelectorAll('.blogs-blog-image, .blogs-blog-body')].forEach(div => {
        const wrapper = document.createElement('a');
        wrapper.setAttribute('href', blogUrl);
        wrapper.classList.add(div.className + '-link'); // Add a class for styling if needed
        div.parentNode.insertBefore(wrapper, div);
        wrapper.appendChild(div);
      });
    }
    ul.append(li);
  });

  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
