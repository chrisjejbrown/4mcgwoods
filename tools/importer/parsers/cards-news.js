/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-news
 * Extracts news/insights/events items from homepage (.home-news-carousel)
 * or practice pages (.c-related-posts with Glide carousel).
 * Each item: category + title link + date.
 * Model: card { image, text (collapsed) }
 */
export default function parse(element, { document }) {
  const rows = [];

  // Detect DOM variant: homepage uses Splide, practice page uses Glide with article.c-card-media
  const homepageItems = element.querySelectorAll('.splide__slide:not(.splide__slide--clone) .kt-blocks-post-grid-item');
  const practiceArticles = element.querySelectorAll('article.c-card-media');

  if (homepageItems.length > 0) {
    // Homepage variant: .home-news-carousel > .splide__slide > .kt-blocks-post-grid-item
    homepageItems.forEach((item) => {
      const imageCell = document.createDocumentFragment();
      const textCell = document.createDocumentFragment();

      const categoryEl = item.querySelector('.kt-blocks-above-categories a');
      if (categoryEl) {
        const catP = document.createElement('p');
        catP.textContent = categoryEl.textContent.trim();
        textCell.appendChild(catP);
      }

      const titleLink = item.querySelector('.entry-title a');
      if (titleLink) {
        const h3 = document.createElement('h3');
        const a = document.createElement('a');
        a.href = titleLink.getAttribute('href') || '';
        a.textContent = titleLink.textContent.trim();
        h3.appendChild(a);
        textCell.appendChild(h3);
      }

      const dateEl = item.querySelector('.kt-blocks-post-date');
      if (dateEl) {
        const dateP = document.createElement('p');
        dateP.textContent = dateEl.textContent.trim();
        textCell.appendChild(dateP);
      }

      rows.push([imageCell, textCell]);
    });
  } else if (practiceArticles.length > 0) {
    // Practice page variant: article.c-card-media (news, insights, events)
    practiceArticles.forEach((article) => {
      const imageCell = document.createDocumentFragment();
      const textCell = document.createDocumentFragment();

      const categoryEl = article.querySelector('.c-card__type');
      if (categoryEl) {
        const catP = document.createElement('p');
        catP.textContent = categoryEl.textContent.trim();
        textCell.appendChild(catP);
      }

      const titleEl = article.querySelector('h3.c-card__title');
      const link = article.querySelector('a.c-card__link');
      if (titleEl) {
        const h3 = document.createElement('h3');
        if (link && link.getAttribute('href')) {
          const a = document.createElement('a');
          a.href = link.getAttribute('href');
          a.textContent = titleEl.textContent.trim();
          h3.appendChild(a);
        } else {
          h3.textContent = titleEl.textContent.trim();
        }
        textCell.appendChild(h3);
      }

      const dateEl = article.querySelector('.c-card__date');
      if (dateEl) {
        const dateP = document.createElement('p');
        dateP.textContent = dateEl.textContent.trim();
        textCell.appendChild(dateP);
      }

      rows.push([imageCell, textCell]);
    });
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Cards News',
    cells: rows,
  });

  element.replaceWith(block);
}
