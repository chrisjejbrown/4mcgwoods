/* eslint-disable */
/* global WebImporter */

/**
 * Parser: tabs-services
 * Base block: tabs
 * Source: https://www.mcguirewoods.com/services/
 * Description: Tabbed navigation with 3 tabs (Practices, Industries, A-Z) containing
 *              categorized service links organized in accordion groupings and button links.
 *
 * Target structure (from block library):
 *   Row per tab: [Tab Label, Tab Content (richtext)]
 *
 * xwalk model fields (tabs-services-item):
 *   - title (tab label)
 *   - content_heading (grouped with content_*)
 *   - content_headingType (collapsed - skip)
 *   - content_image (grouped with content_*)
 *   - content_richtext (grouped with content_*)
 */
export default function parse(element, { document }) {
  // Extract tab labels from the tab title list
  const tabTitles = element.querySelectorAll('.kt-tabs-title-list .kt-title-text');

  // Extract tab panels (each .services-tab div)
  const tabPanels = element.querySelectorAll('.kt-tabs-content-wrap > .services-tab');

  const cells = [];

  tabTitles.forEach((titleEl, index) => {
    const tabLabel = titleEl.textContent.trim();
    const panel = tabPanels[index];

    // Build tab label cell with field hint
    const titleFrag = document.createDocumentFragment();
    titleFrag.appendChild(document.createComment(' field:title '));
    const titleText = document.createTextNode(tabLabel);
    titleFrag.appendChild(titleText);

    // Build tab content cell - flatten accordion groups and button links into richtext
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:content_richtext '));

    if (panel) {
      // Process each column in the tab panel
      const columns = panel.querySelectorAll('.kt-inside-inner-col');

      columns.forEach((col) => {
        // Process accordion groups (category headings + link lists)
        const accordionPanes = col.querySelectorAll('.kt-accordion-pane');
        // Process standalone button links (not inside accordions)
        const buttonLinks = col.querySelectorAll(':scope > .wp-block-kadence-advancedbtn');

        // Process button links first (they appear as direct links, not under accordions)
        buttonLinks.forEach((btnWrap) => {
          const link = btnWrap.querySelector('a');
          if (link) {
            const p = document.createElement('p');
            const a = document.createElement('a');
            a.href = link.href;
            const btnText = link.querySelector('.kt-btn-inner-text');
            a.textContent = btnText ? btnText.textContent.trim() : link.textContent.trim();
            p.appendChild(a);
            contentFrag.appendChild(p);
          }
        });

        // Process accordion panes (category heading + nested link list)
        accordionPanes.forEach((pane) => {
          // Category heading from accordion title
          const accordionTitle = pane.querySelector('.kt-blocks-accordion-title');
          if (accordionTitle) {
            const h3 = document.createElement('h3');
            h3.textContent = accordionTitle.textContent.trim();
            contentFrag.appendChild(h3);
          }

          // Link list from accordion panel
          const linkList = pane.querySelector('.kt-accordion-panel-inner ul');
          if (linkList) {
            // Clone the list to preserve nested structure
            const clonedList = linkList.cloneNode(true);
            contentFrag.appendChild(clonedList);
          }
        });
      });
    }

    cells.push([titleFrag, contentFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'tabs-services',
    cells,
  });

  element.replaceWith(block);
}
