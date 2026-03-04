/* eslint-disable */
/* global WebImporter */

/**
 * Parser: accordion-service
 * Extracts accordion items from .kt-accordion-id48671_e48fd9-64.
 * Each item: title + body content.
 * Model: accordion-service-item { summary, text (collapsed) }
 */
export default function parse(element, { document }) {
  const panes = element.querySelectorAll('.wp-block-kadence-pane');
  const rows = [];

  panes.forEach((pane) => {
    // Extract title from accordion header
    const titleEl = pane.querySelector('.kt-blocks-accordion-title');

    // Build summary cell with field hint
    const summaryCell = document.createDocumentFragment();
    summaryCell.appendChild(document.createComment(' field:summary '));
    const titleP = document.createElement('p');
    titleP.textContent = titleEl ? titleEl.textContent.trim() : '';
    summaryCell.appendChild(titleP);

    // Build text cell (text is collapsed "Text" label - no hint)
    const textCell = document.createDocumentFragment();
    const panelInner = pane.querySelector('.kt-accordion-panel-inner');
    if (panelInner) {
      const paragraphs = panelInner.querySelectorAll('p');
      paragraphs.forEach((p) => {
        const newP = document.createElement('p');
        newP.innerHTML = p.innerHTML;
        textCell.appendChild(newP);
      });
    }

    rows.push([summaryCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Accordion Service',
    cells: rows,
  });

  element.replaceWith(block);
}
