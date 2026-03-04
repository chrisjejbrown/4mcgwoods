/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: McGuireWoods section breaks and section-metadata.
 * Adds <hr> between sections and section-metadata blocks for styled sections.
 * Runs in afterTransform only. Uses payload.template.sections.
 * Selectors from captured DOM of https://www.mcguirewoods.com
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document: element.getRootNode() };
    const template = payload && payload.template;
    if (!template || !template.sections || template.sections.length < 2) return;

    // Process sections in reverse order to avoid offset issues
    const sections = [...template.sections].reverse();

    for (const section of sections) {
      // Find the section element using the selector
      const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
      let sectionEl = null;
      for (const sel of selectors) {
        sectionEl = element.querySelector(sel);
        if (sectionEl) break;
      }

      if (!sectionEl) continue;

      // Add section-metadata block after the section element if it has a style
      if (section.style) {
        const sectionMetadata = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(sectionMetadata);
      }

      // Add <hr> before the section element (except for the first section)
      if (section.id !== template.sections[0].id) {
        const hr = document.createElement('hr');
        sectionEl.before(hr);
      }
    }
  }
}
