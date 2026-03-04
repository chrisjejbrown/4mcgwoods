export default async function decorate(block) {
  const [quotation, attribution] = [...block.children].map((c) => c.firstElementChild);
  const blockquote = document.createElement('blockquote');
  // decorate quotation
  quotation.className = 'quote-testimonial-quotation';
  // unwrap any inner <blockquote> that the content may already contain
  const innerBq = quotation.querySelector('blockquote');
  if (innerBq) {
    const paragraphs = [...innerBq.children];
    quotation.innerHTML = '';
    paragraphs.forEach((p) => quotation.appendChild(p));
  }
  blockquote.append(quotation);
  // decoration attribution
  if (attribution) {
    attribution.className = 'quote-testimonial-attribution';
    blockquote.append(attribution);
    const ems = attribution.querySelectorAll('em');
    ems.forEach((em) => {
      const cite = document.createElement('cite');
      cite.innerHTML = em.innerHTML;
      em.replaceWith(cite);
    });
  }
  block.innerHTML = '';
  block.append(blockquote);
}
