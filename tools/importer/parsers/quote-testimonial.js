/* eslint-disable */
/* global WebImporter */

/**
 * Parser: quote-testimonial
 * Extracts testimonial quote from .animated-testimonial.
 * Quote text + attribution.
 * Model: quote-testimonial { quotation, attribution }
 */
export default function parse(element, { document }) {
  // Find quote text (the bold paragraph)
  const quoteEl = element.querySelector('strong');
  const quoteText = quoteEl ? quoteEl.textContent.trim() : '';

  // Find attribution (last paragraph without strong/bold)
  const paragraphs = element.querySelectorAll('p[class*="wp-block-kadence-advancedheading"]');
  let attribution = '';
  if (paragraphs.length >= 2) {
    attribution = paragraphs[paragraphs.length - 1].textContent.trim();
  }

  // Build quotation cell with field hint
  const quotationCell = document.createDocumentFragment();
  quotationCell.appendChild(document.createComment(' field:quotation '));
  const blockquote = document.createElement('blockquote');
  blockquote.textContent = quoteText;
  quotationCell.appendChild(blockquote);

  // Build attribution cell with field hint
  const attributionCell = document.createDocumentFragment();
  attributionCell.appendChild(document.createComment(' field:attribution '));
  const attrP = document.createElement('p');
  attrP.textContent = attribution;
  attributionCell.appendChild(attrP);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Quote Testimonial',
    cells: [[quotationCell], [attributionCell]],
  });

  element.replaceWith(block);
}
