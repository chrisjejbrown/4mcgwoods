/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-people
 * Extracts person cards from homepage (.home-team-members-slider)
 * or practice pages (.wp-block-mgw-people-content-selector).
 * Each card: photo + name + title + profile link.
 * Model: card { image, text (collapsed) }
 */
export default function parse(element, { document }) {
  const rows = [];

  // Detect DOM variant: homepage uses Splide slider, practice page uses article cards
  const homepageSlides = element.querySelectorAll('.splide__slide:not(.splide__slide--clone)');
  const practiceCards = element.querySelectorAll('article.c-card-people');

  if (homepageSlides.length > 0) {
    // Homepage variant: .home-team-members-slider > .splide__slide > .team-member-card
    homepageSlides.forEach((slide) => {
      const cards = slide.querySelectorAll('.team-member-card');
      cards.forEach((card) => {
        const img = card.querySelector('img');
        const imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(' field:image '));
        if (img) {
          const picture = document.createElement('img');
          picture.src = img.getAttribute('src') || '';
          picture.alt = img.getAttribute('alt') || '';
          imageCell.appendChild(picture);
        }

        const textCell = document.createDocumentFragment();
        const nameEl = card.querySelector('.team-member-card-name, h3, h4');
        if (nameEl) {
          const h = document.createElement('h3');
          h.textContent = nameEl.textContent.trim();
          textCell.appendChild(h);
        }
        const titleEl = card.querySelector('.team-member-card-title, .team-member-card-position');
        if (titleEl) {
          const p = document.createElement('p');
          p.textContent = titleEl.textContent.trim();
          textCell.appendChild(p);
        }
        const link = card.querySelector('a[href]');
        if (link && link.getAttribute('href')) {
          const p = document.createElement('p');
          const a = document.createElement('a');
          a.href = link.getAttribute('href');
          a.textContent = nameEl ? nameEl.textContent.trim() : 'View Profile';
          p.appendChild(a);
          textCell.appendChild(p);
        }
        rows.push([imageCell, textCell]);
      });
    });
  } else if (practiceCards.length > 0) {
    // Practice page variant: article.c-card-people
    practiceCards.forEach((card) => {
      const img = card.querySelector('.c-card-people__profile-img img');
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:image '));
      if (img) {
        const picture = document.createElement('img');
        picture.src = img.getAttribute('src') || '';
        picture.alt = img.getAttribute('alt') || '';
        imageCell.appendChild(picture);
      }

      const textCell = document.createDocumentFragment();
      const nameEl = card.querySelector('h3.c-card__title');
      if (nameEl) {
        const h = document.createElement('h3');
        h.textContent = nameEl.textContent.trim();
        textCell.appendChild(h);
      }
      const roleEl = card.querySelector('.c-card-people__role');
      if (roleEl) {
        const p = document.createElement('p');
        p.textContent = roleEl.textContent.trim();
        textCell.appendChild(p);
      }
      const link = card.querySelector('h3.c-card__title a[href]');
      if (link && link.getAttribute('href')) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = nameEl ? nameEl.textContent.trim() : 'View Profile';
        p.appendChild(a);
        textCell.appendChild(p);
      }
      rows.push([imageCell, textCell]);
    });
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Cards People',
    cells: rows,
  });

  element.replaceWith(block);
}
