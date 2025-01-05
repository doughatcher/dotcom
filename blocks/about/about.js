export default function decorate(block) {
  const leftChild = block.children[0];
  const rightChild = block.children[1];
  leftChild.classList.add('about-left');
  rightChild.classList.add('about-right');
}
