/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: McGuireWoods site-wide cleanup.
 * Selectors from captured DOM of https://www.mcguirewoods.com
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove hidden sections (hidden on all viewports)
    // Found: <div class="kb-row-layout-wrap kb-row-layout-id48671_854e7e-c5 ... kb-v-lg-hidden kb-v-md-hidden kb-v-sm-hidden">
    WebImporter.DOMUtils.remove(element, [
      '.kb-v-lg-hidden.kb-v-md-hidden.kb-v-sm-hidden',
    ]);

    // Remove splide clone slides (duplicated by JS for infinite scroll)
    // Found: <li class="... splide__slide--clone">
    WebImporter.DOMUtils.remove(element, [
      '.splide__slide--clone',
    ]);

    // Remove splide arrows (navigation UI, not authorable)
    // Found: <div class="splide__arrows ...">
    WebImporter.DOMUtils.remove(element, [
      '.splide__arrows',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable site chrome
    // Found: <header id="masthead" class="main-site-header c-site-header ...">
    // Found: <footer id="colophon" class="c-site-footer">
    // Found: <a class="skip-link screen-reader-text" href="#content">
    WebImporter.DOMUtils.remove(element, [
      '#masthead',
      '#colophon',
      '.skip-link',
      '.screen-reader-text',
      'noscript',
      'link',
      'iframe',
    ]);

    // Remove data attributes and tracking
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-track');
      el.removeAttribute('onclick');
      el.removeAttribute('data-splide');
    });
  }
}
