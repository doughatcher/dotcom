// Import the Story type from '@storybook/html' to get better typing support
import { Story } from '@storybook/html';
import './blog.css'; // This imports your existing CSS styles for the blog

export default {
  title: 'Blog',
  // Define argTypes for the controls you want to provide
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    image: { control: 'text' },
    path: { control: 'text' }
  },
};

// Define a template for your story that accepts args
const Template: Story = ({title, description, image, path}) => {
  // Ensure external resources are loaded
  const loadExternalResources = () => {
    const scriptAem = document.createElement('script');
    scriptAem.src = 'http://localhost:3000/scripts/aem.js';
    scriptAem.type = 'module';

    const scriptScripts = document.createElement('script');
    scriptScripts.src = 'http://localhost:3000/scripts/scripts.js';
    scriptScripts.type = 'module';

    const linkStyles = document.createElement('link');
    linkStyles.rel = 'stylesheet';
    linkStyles.href = 'http://localhost:3000/styles/styles.css';

    document.head.appendChild(scriptAem);
    document.head.appendChild(scriptScripts);
    document.head.appendChild(linkStyles);
  };

  loadExternalResources();

  // Create the outer container div with the .blog class
  const blogContainer = document.createElement('div');
  blogContainer.className = 'blog';

  // Create the ul element to contain the blog posts
  const ul = document.createElement('ul');

  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = path || '#'; // Use args.path or fallback to '#'
  a.className = 'blogs-blog-link';

  if (image) {
    const divImage = document.createElement('div');
    divImage.className = 'blogs-blog-image';

    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = image; // Use args.image

    const img = document.createElement('img');
    img.loading = "lazy";
    img.src = image; // Use args.image

    picture.appendChild(source);
    picture.appendChild(img);
    divImage.appendChild(picture);
    a.appendChild(divImage);
  }

  const divTitle = document.createElement('div');
  divTitle.className = 'blogs-blog-title';
  divTitle.textContent = title; // Use args.title
  
  const divDescription = document.createElement('div');
  divDescription.className = 'blogs-blog-body';
  divDescription.textContent = description; // Use args.description

  a.appendChild(divTitle);
  a.appendChild(divDescription);
  
  li.appendChild(a);
  ul.appendChild(li);

  // Append the ul element to the blog container
  blogContainer.appendChild(ul);

  return blogContainer;
};

// Default story with controls for title, description, image, and path
export const Default = Template.bind({});
Default.args = { 
  title: "Sample Blog Post",
  description: "This is a sample description of a blog post.",
  image: "/blocks/blog/image.webp", // Provide a default image path
  path: "/sample-blog-post"
};


