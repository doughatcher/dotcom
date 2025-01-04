/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate() {
  document.querySelector('body > main > div.section.hero-container > div > div').classList.add('finisher-header');
}
