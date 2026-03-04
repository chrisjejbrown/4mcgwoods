/* eslint-disable */
/* global WebImporter */

/**
 * Parser: carousel-hero
 * Extracts hero slider slides from .home-hero-slider.
 * Each slide: H1 heading + CTA link (left column), video (right column).
 * Model: carousel-hero-item { media_image, media_imageAlt (collapsed), content_text (collapsed) }
 */
export default function parse(element, { document }) {
  const slides = element.querySelectorAll('.splide__slide:not(.splide__slide--clone)');
  const rows = [];

  slides.forEach((slide) => {
    // Extract heading and CTA from first column
    const heading = slide.querySelector('h1');
    const ctaLink = slide.querySelector('.kb-button');

    // Extract video source for the image cell
    const video = slide.querySelector('video.kb-blocks-bg-video');

    // Build image cell with field hint
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:media_image '));
    if (video && video.getAttribute('src')) {
      const videoLink = document.createElement('a');
      videoLink.href = video.getAttribute('src');
      videoLink.textContent = video.getAttribute('src');
      imageCell.appendChild(videoLink);
    }

    // Build text cell (content_text is collapsed "Text" label - no hint)
    const textCell = document.createDocumentFragment();
    if (heading) {
      const h = document.createElement('h1');
      h.textContent = heading.textContent.trim();
      textCell.appendChild(h);
    }
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
    name: 'Carousel Hero',
    cells: rows,
  });

  element.replaceWith(block);
}
