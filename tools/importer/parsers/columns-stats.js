/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns-stats
 * Extracts stats section from .kb-row-layout-id48671_2dfa34-9f.
 * Two columns: heading on left, stats grid (6 counters) on right.
 * Columns block: NO field hints needed per xwalk hinting rules.
 */
export default function parse(element, { document }) {
  // Extract left column: heading
  const heading = element.querySelector('h2');
  const leftCell = document.createDocumentFragment();
  if (heading) {
    const h2 = document.createElement('h2');
    h2.innerHTML = heading.innerHTML;
    leftCell.appendChild(h2);
  }

  // Extract right column: stats counters
  const rightCell = document.createDocumentFragment();
  const counters = element.querySelectorAll('.kb-count-up');

  counters.forEach((counter) => {
    // Read from .screen-reader-text which has the final counter value
    // (.kb-count-up-number shows "0" on live page before animation runs)
    const srText = counter.querySelector('.screen-reader-text');
    const numberEl = srText || counter.querySelector('.kb-count-up-number');
    const titleEl = counter.querySelector('.kb-count-up-title');

    if (numberEl && titleEl) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = numberEl.textContent.trim();
      p.appendChild(strong);
      p.appendChild(document.createTextNode(' ' + titleEl.textContent.trim()));
      rightCell.appendChild(p);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Columns Stats',
    cells: [[leftCell, rightCell]],
  });

  element.replaceWith(block);
}
