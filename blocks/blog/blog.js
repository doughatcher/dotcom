import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Fetch the data from `/query-index.json`
  const response = await fetch('/query-index.json');
  const { data } = await response.json();

  // Create a <ul> element to hold the list of items
  const ul = document.createElement('ul');

  // Iterate over the `data` array and create <li> elements for each item
  data.forEach((item) => {
    const li = document.createElement('li');

    // Create and append the blog image
    if (item.image) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'blogs-blog-image';
      const picture = createOptimizedPicture(item.image, item.title, false, [{ width: '750' }]);
      imgWrapper.appendChild(picture);
      li.appendChild(imgWrapper);
    }

    // Create and append the blog URL as a hidden element (for consistency with original code)
    if (item.path) {
      const blogUrl = document.createElement('div');
      blogUrl.className = 'blogs-blog-url';
      blogUrl.textContent = item.path;
      blogUrl.style.display = 'none'; // Hide the blog URL element
      li.appendChild(blogUrl);
    }

    // Create and append the blog description
    if (item.title) {
      const title = document.createElement('div');
      title.className = 'blogs-blog-title';
      title.textContent = item.title;
      li.appendChild(title);
    }

    if (item.description) {
      const desc = document.createElement('div');
      desc.className = 'blogs-blog-body';
      desc.textContent = item.description;
      li.appendChild(desc);
    }

    // Wrap image and body in a link
    const wrapper = document.createElement('a');
    wrapper.setAttribute('href', item.path);
    wrapper.classList.add('blogs-blog-link'); // Add a class for styling
    while (li.firstChild) {
      wrapper.appendChild(li.firstChild); // Move all children under the wrapper
    }
    li.appendChild(wrapper); // Add the wrapper back to the li

    // Append the <li> element to the <ul>
    if (item.path !== '/') {
      ul.appendChild(li);
    }
  });

  // Clear the block and append the <ul>
  block.textContent = '';
  block.append(ul);
}
