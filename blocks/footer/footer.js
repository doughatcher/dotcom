import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  block.textContent = '';

  // load footer fragment
  const footerPath = footerMeta.footer || '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);

  const newsletterWrapper = document.querySelector('.footer.block');
  if (newsletterWrapper) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://eocampaign1.com/form/6ec217ee-cae9-11ef-b651-8b8cd4515de1.js';
    script.setAttribute('data-form', '6ec217ee-cae9-11ef-b651-8b8cd4515de1');
    newsletterWrapper.appendChild(script);
  }
}
