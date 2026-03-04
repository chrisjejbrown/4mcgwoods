/* eslint-disable */
/* global WebImporter */

/**
 * Parser: search-bar
 * Extracts search form from .home-search-form.
 * Simple block with index URL.
 * Model: search-bar { index, classes (skip) }
 */
export default function parse(element, { document }) {
  // Build index cell with field hint
  const indexCell = document.createDocumentFragment();
  indexCell.appendChild(document.createComment(' field:index '));

  // Use a query-index.json URL placeholder for the search index
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = '/query-index.json';
  a.textContent = '/query-index.json';
  p.appendChild(a);
  indexCell.appendChild(p);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Search Bar',
    cells: [[indexCell]],
  });

  element.replaceWith(block);
}
