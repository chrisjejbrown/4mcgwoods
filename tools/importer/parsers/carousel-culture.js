/* eslint-disable */
/* global WebImporter */

/**
 * Parser: carousel-culture
 * Extracts culture carousel slides from .home-culture-carousel.
 * Each slide: image + title + description + CTA link.
 * Model: carousel-culture-item { media_image, media_imageAlt (collapsed), content_text (collapsed) }
 */
export default function parse(element, { document }) {
  const slides = element.querySelectorAll('.splide__slide:not(.splide__slide--clone)');
  const rows = [];

  slides.forEach((slide) => {
    // Extract image
    const img = slide.querySelector('.kt-inside-inner-col img');

    // Build image cell with field hint
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:media_image '));
    if (img) {
      const picture = document.createElement('img');
      picture.src = img.getAttribute('src') || '';
      picture.alt = img.getAttribute('alt') || '';
      imageCell.appendChild(picture);
    }

    // Build text cell (content_text is collapsed "Text" label - no hint)
    const textCell = document.createDocumentFragment();

    // Extract title
    const titleEl = slide.querySelector('h3');
    if (titleEl) {
      const h = document.createElement('h3');
      h.textContent = titleEl.textContent.trim();
      textCell.appendChild(h);
    }

    // Extract description
    const descEl = slide.querySelector('p[class*="wp-block-kadence-advancedheading"]');
    if (descEl) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      textCell.appendChild(p);
    }

    // Extract CTA link
    const ctaLink = slide.querySelector('.kb-button');
    if (ctaLink) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = ctaLink.getAttribute('href') || '';
      const btnText = ctaLink.querySelector('.kt-btn-inner-text');
      a.textContent = btnText ? btnText.textContent.trim() : ctaLink.textContent.trim();
      p.appendChild(a);
      textCell.appendChild(p);
    }

    rows.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Carousel Culture',
    cells: rows,
  });

  element.replaceWith(block);
}
