/* eslint-disable */
/* global WebImporter */

/**
 * Parser: carousel-initiatives
 * Extracts initiative image links from a Splide carousel.
 * Each slide is a figure containing a linked image (figure > a > img).
 * Model: carousel-initiatives { heading, items[] { image, link } }
 */
export default function parse(element, { document }) {
  // The element is the parent wrapper containing .initatives-slider
  // Find the heading
  const h2 = element.querySelector('h2');

  // Find all slides with figures (skip Splide clones)
  const figures = element.querySelectorAll('.splide__slide:not(.splide__slide--clone) figure');

  const cells = [];

  figures.forEach((figure) => {
    const link = figure.querySelector('a');
    const img = figure.querySelector('img');

    if (!link || !img) return;

    // Build image cell with field hint
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    const newImg = document.createElement('img');
    newImg.src = img.getAttribute('src') || '';
    newImg.alt = img.getAttribute('alt') || '';
    imageCell.appendChild(newImg);

    // Build link cell with field hint
    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    const a = document.createElement('a');
    a.href = link.getAttribute('href') || '';
    a.textContent = img.getAttribute('alt') || link.getAttribute('href') || '';
    linkCell.appendChild(a);

    cells.push([imageCell, linkCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Carousel Initiatives',
    cells,
  });

  // Prepend heading before the block if present
  if (h2) {
    const heading = document.createElement('h2');
    heading.textContent = h2.textContent.trim();
    element.before(heading);
  }

  element.replaceWith(block);
}
