/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate() {
  document.querySelector('body > main > div.section.hero-container > div > div').classList.add('finisher-header');

  const pictureElement = document.querySelector('.hero-container picture');
  if (pictureElement) {
    pictureElement.remove();
  }

  const headerobserver = new MutationObserver((mutations, observer) => {
    const finisherHeader = document.querySelector('.finisher-header');
    if (finisherHeader) {
      observer.disconnect();
      // eslint-disable-next-line no-new, no-undef
      new FinisherHeader({
        count: 10,
        size: {
          min: 1300,
          max: 1500,
          pulse: 0,
        },
        speed: {
          x: {
            min: 0.1,
            max: 0.6,
          },
          y: {
            min: 0.1,
            max: 0.6,
          },
        },
        colors: {
          background: '#9138e5',
          particles: [
            '#ff4848',
            '#000000',
            '#2235e5',
            '#000000',
            '#ff0000',
          ],
        },
        blending: 'overlay',
        opacity: {
          center: 0.5,
          edge: 0.05,
        },
        // 'skew': -2,
        shapes: [
          'c',
        ],
      });
    }
  });

  headerobserver.observe(document.body, { childList: true, subtree: true });
}
