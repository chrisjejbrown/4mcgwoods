import { moveInstrumentation } from '../../scripts/scripts.js';

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;
  const slides = block.querySelectorAll('.carousel-initiatives-slide');
  slides.forEach((slide, idx) => {
    slide.setAttribute('aria-hidden', idx !== slideIndex);
    slide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) link.setAttribute('tabindex', '-1');
      else link.removeAttribute('tabindex');
    });
  });
  const indicators = block.querySelectorAll('.carousel-initiatives-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) indicator.querySelector('button').removeAttribute('disabled');
    else indicator.querySelector('button').setAttribute('disabled', 'true');
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-initiatives-slide');
  let idx = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (idx >= slides.length) idx = 0;
  const target = slides[idx];
  block.querySelector('.carousel-initiatives-slides').scrollTo({
    top: 0,
    left: target.offsetLeft,
    behavior: 'smooth',
  });
}

let instanceId = 0;

export default function decorate(block) {
  instanceId += 1;
  block.setAttribute('id', `carousel-initiatives-${instanceId}`);
  const rows = [...block.querySelectorAll(':scope > div')];

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-initiatives-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-initiatives-slides');

  rows.forEach((row, idx) => {
    const slide = document.createElement('li');
    slide.classList.add('carousel-initiatives-slide');
    slide.dataset.slideIndex = idx;
    slide.setAttribute('id', `carousel-initiatives-${instanceId}-slide-${idx}`);

    const cols = row.querySelectorAll(':scope > div');
    const imageCol = cols[0];
    const linkCol = cols[1];

    // Wrap image in link if link exists
    const linkEl = linkCol?.querySelector('a');
    const imgEl = imageCol?.querySelector('img');

    if (linkEl && imgEl) {
      const a = document.createElement('a');
      a.href = linkEl.href;
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.classList.add('carousel-initiatives-card');

      const pic = imageCol.querySelector('picture') || imgEl;
      a.append(pic);
      slide.append(a);
    } else if (imgEl) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('carousel-initiatives-card');
      const pic = imageCol.querySelector('picture') || imgEl;
      wrapper.append(pic);
      slide.append(wrapper);
    }

    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);

  // Navigation buttons
  if (rows.length > 1) {
    const nav = document.createElement('div');
    nav.classList.add('carousel-initiatives-nav');
    nav.innerHTML = `
      <button type="button" class="slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    `;
    container.append(nav);

    // Dot indicators
    const indicatorsNav = document.createElement('nav');
    indicatorsNav.setAttribute('aria-label', 'Slide Controls');
    const indicators = document.createElement('ol');
    indicators.classList.add('carousel-initiatives-indicators');
    rows.forEach((_, idx) => {
      const li = document.createElement('li');
      li.classList.add('carousel-initiatives-indicator');
      li.dataset.targetSlide = idx;
      li.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"></button>`;
      indicators.append(li);
    });
    indicatorsNav.append(indicators);
    block.append(indicatorsNav);

    // Event listeners
    nav.querySelector('.slide-prev').addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
    });
    nav.querySelector('.slide-next').addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
    });
    indicators.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const indicator = e.currentTarget.parentElement;
        showSlide(block, parseInt(indicator.dataset.targetSlide, 10));
      });
    });

    // Intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
        }
      });
    }, { threshold: 0.5 });
    slidesWrapper.querySelectorAll('.carousel-initiatives-slide').forEach((s) => observer.observe(s));
  }

  block.prepend(container);
}
