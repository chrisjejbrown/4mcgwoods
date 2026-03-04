/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero-practice
 * Extracts practice hero from .service-hero-section.
 * Model: hero-practice { image, imageAlt (collapsed), text }
 *
 * Simple block layout: 2 rows × 1 cell each.
 *   Row 1: <!-- field:image --> <img src="..." alt="...">
 *   Row 2: <!-- field:text --> <h1>...</h1><p>...</p>
 *
 * imageAlt is a collapsed field (suffix Alt) — embedded as <img alt="">,
 * NOT a separate cell or hint.
 */
export default function parse(element, { document }) {
  // Find the image - try <img> first, then background-image
  const imgEl = element.querySelector('.hide-on-print img, img[src*="images/"]');
  let bgImageUrl = '';

  if (!imgEl) {
    const bgCandidates = element.querySelectorAll('.kt-inside-inner-col, [style*="background"]');
    for (const candidate of bgCandidates) {
      const style = candidate.getAttribute('style') || '';
      const match = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/);
      if (match) {
        bgImageUrl = match[1];
        break;
      }
      const bgMatch = style.match(/background:\s*[^;]*url\(["']?([^"')]+)["']?\)/);
      if (bgMatch) {
        bgImageUrl = bgMatch[1];
        break;
      }
    }
  }

  // Row 1: image cell with field hint
  // imageAlt is collapsed into <img alt=""> per xwalk hinting rules
  const imageCell = document.createDocumentFragment();
  imageCell.appendChild(document.createComment(' field:image '));
  if (imgEl) {
    const img = document.createElement('img');
    img.src = imgEl.getAttribute('src') || '';
    img.alt = imgEl.getAttribute('alt') || '';
    imageCell.appendChild(img);
  } else if (bgImageUrl) {
    const img = document.createElement('img');
    img.src = bgImageUrl;
    img.alt = '';
    imageCell.appendChild(img);
  }

  // Row 2: text cell with field hint
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));

  const h1 = element.querySelector('h1');
  if (h1) {
    const heading = document.createElement('h1');
    heading.textContent = h1.textContent.trim();
    textCell.appendChild(heading);
  }

  const descEl = element.querySelector('p[class*="wp-block-kadence-advancedheading"]');
  if (descEl) {
    const p = document.createElement('p');
    p.textContent = descEl.textContent.trim();
    textCell.appendChild(p);
  }

  const ctaLink = element.querySelector('.wp-block-kadence-advancedbtn a');
  if (ctaLink) {
    const href = ctaLink.getAttribute('href') || '#';
    if (href !== '#') {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      const btnText = ctaLink.querySelector('.kt-btn-inner-text');
      a.textContent = btnText ? btnText.textContent.trim() : ctaLink.textContent.trim();
      p.appendChild(a);
      textCell.appendChild(p);
    }
  }

  // Simple block: each field is its own row (2 rows × 1 cell)
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Hero Practice',
    cells: [[imageCell], [textCell]],
  });

  element.replaceWith(block);
}
