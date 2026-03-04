/* eslint-disable */
/* global WebImporter */

/**
 * Parser: tabs-related
 * Extracts related practices/industries from .service-related-tabs.
 * 2 tabs with service card link lists.
 * Model: tabs-related-item { title, content_richtext }
 */
export default function parse(element, { document }) {
  const tabTitles = element.querySelectorAll('.kt-tabs-title-list .kt-title-text');
  const tabPanels = element.querySelectorAll('.kt-tabs-content-wrap > .wp-block-kadence-tab');
  const cells = [];

  tabTitles.forEach((titleEl, index) => {
    const tabLabel = titleEl.textContent.trim();
    const panel = tabPanels[index];

    // Build tab label cell with field hint
    const titleFrag = document.createDocumentFragment();
    titleFrag.appendChild(document.createComment(' field:title '));
    const titleText = document.createTextNode(tabLabel);
    titleFrag.appendChild(titleText);

    // Build tab content cell with field hint
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:content_richtext '));

    if (panel) {
      // Extract service card links from the tab panel
      const serviceCards = panel.querySelectorAll('.c-card-service');
      const ul = document.createElement('ul');

      serviceCards.forEach((card) => {
        const link = card.querySelector('a');
        const heading = card.querySelector('.c-card-service__heading');
        if (link && heading) {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = link.getAttribute('href') || '';
          a.textContent = heading.textContent.trim();
          li.appendChild(a);
          ul.appendChild(li);
        }
      });

      if (ul.children.length > 0) {
        contentFrag.appendChild(ul);
      }
    }

    cells.push([titleFrag, contentFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Tabs Related',
    cells,
  });

  element.replaceWith(block);
}
