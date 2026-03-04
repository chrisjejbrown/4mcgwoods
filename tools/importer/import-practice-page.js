/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroPracticeParser from './parsers/hero-practice.js';
import quoteTestimonialParser from './parsers/quote-testimonial.js';
import cardsPeopleParser from './parsers/cards-people.js';
import tabsRelatedParser from './parsers/tabs-related.js';
import cardsNewsParser from './parsers/cards-news.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/mcguirewoods-cleanup.js';
import sectionsTransformer from './transformers/mcguirewoods-sections.js';

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'practice-page',
  description: 'Practice area detail page with overview, sub-practices, related professionals, and experience highlights',
  urls: [
    'https://www.mcguirewoods.com/services/practices/business-litigation',
    'https://www.mcguirewoods.com/services/practices/intellectual-property',
    'https://www.mcguirewoods.com/services/practices/data-privacy-cybersecurity'
  ],
  blocks: [
    {
      name: 'hero-practice',
      instances: ['.service-hero-section']
    },
    {
      name: 'quote-testimonial',
      instances: ['.animated-testimonial']
    },
    {
      name: 'cards-people',
      instances: ['.wp-block-mgw-people-content-selector']
    },
    {
      name: 'tabs-related',
      instances: ['.service-related-tabs']
    },
    {
      name: 'cards-news',
      instances: ['.c-related-posts']
    }
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero Banner',
      selector: '.service-hero-section',
      style: null,
      blocks: ['hero-practice'],
      defaultContent: []
    },
    {
      id: 'section-2',
      name: 'Read More Content',
      selector: '.read-more-content',
      style: null,
      blocks: [],
      defaultContent: ['.read-more-content']
    },
    {
      id: 'section-3',
      name: 'Practice Tagline',
      selector: ['.kb-row-layout-id137_9f4a50-53', '.entry-content > .kb-row-layout-wrap.kt-row-has-bg:nth-of-type(3)'],
      style: null,
      blocks: [],
      defaultContent: ['.kb-row-layout-id137_9f4a50-53 p']
    },
    {
      id: 'section-4',
      name: 'Testimonial Slider',
      selector: '.animated-testimonial',
      style: null,
      blocks: ['quote-testimonial'],
      defaultContent: []
    },
    {
      id: 'section-5',
      name: 'Team Leaders',
      selector: ['.kb-row-layout-id137_e8b3a0-fa', '.entry-content > .kb-row-layout-wrap:has(.wp-block-mgw-people-content-selector)'],
      style: null,
      blocks: ['cards-people'],
      defaultContent: ['.kb-row-layout-id137_e8b3a0-fa h2']
    },
    {
      id: 'section-6',
      name: 'Related Practices and Industries',
      selector: ['.kb-row-layout-id137_bff9ff-d3', '.entry-content > .kb-row-layout-wrap:has(.service-related-tabs)'],
      style: 'light',
      blocks: ['tabs-related'],
      defaultContent: []
    },
    {
      id: 'section-7',
      name: 'News',
      selector: '.entry-content > .c-related-posts:nth-of-type(1)',
      style: 'dark',
      blocks: ['cards-news'],
      defaultContent: []
    },
    {
      id: 'section-8',
      name: 'Insights',
      selector: '.entry-content > .c-related-posts:nth-of-type(2)',
      style: 'dark',
      blocks: ['cards-news'],
      defaultContent: []
    },
    {
      id: 'section-9',
      name: 'Events',
      selector: '.entry-content > .c-related-posts:nth-of-type(3)',
      style: 'dark',
      blocks: ['cards-news'],
      defaultContent: []
    }
  ]
};

// PARSER REGISTRY
const parsers = {
  'hero-practice': heroPracticeParser,
  'quote-testimonial': quoteTestimonialParser,
  'cards-people': cardsPeopleParser,
  'tabs-related': tabsRelatedParser,
  'cards-news': cardsNewsParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '')
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
