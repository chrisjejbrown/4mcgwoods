/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import cardsPeopleParser from './parsers/cards-people.js';
import searchBarParser from './parsers/search-bar.js';
import quoteTestimonialParser from './parsers/quote-testimonial.js';
import carouselCultureParser from './parsers/carousel-culture.js';
import columnsStatsParser from './parsers/columns-stats.js';
import accordionServiceParser from './parsers/accordion-service.js';
import cardsNewsParser from './parsers/cards-news.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/mcguirewoods-cleanup.js';
import sectionsTransformer from './transformers/mcguirewoods-sections.js';

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Main homepage with hero slider, featured people, search, testimonials, culture, statistics, client service, and news',
  urls: [
    'https://www.mcguirewoods.com'
  ],
  blocks: [
    {
      name: 'carousel-hero',
      instances: ['.home-hero-slider']
    },
    {
      name: 'cards-people',
      instances: ['.home-team-members-slider']
    },
    {
      name: 'search-bar',
      instances: ['.home-search-form']
    },
    {
      name: 'quote-testimonial',
      instances: ['.animated-testimonial']
    },
    {
      name: 'carousel-culture',
      instances: ['.home-culture-carousel']
    },
    {
      name: 'columns-stats',
      instances: ['.kb-row-layout-id48671_2dfa34-9f']
    },
    {
      name: 'accordion-service',
      instances: ['.kt-accordion-id48671_e48fd9-64']
    },
    {
      name: 'cards-news',
      instances: ['.home-news-carousel']
    }
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero Slider',
      selector: '.home-hero-slider-row',
      style: null,
      blocks: ['carousel-hero'],
      defaultContent: []
    },
    {
      id: 'section-2',
      name: 'Featured People',
      selector: '.kb-row-layout-id48671_aaf30d-32',
      style: null,
      blocks: ['cards-people'],
      defaultContent: ['.home-people-title']
    },
    {
      id: 'section-3',
      name: 'Search Bar',
      selector: '.kb-row-layout-id48671_a87e1e-e2',
      style: 'dark',
      blocks: ['search-bar'],
      defaultContent: []
    },
    {
      id: 'section-4',
      name: 'Testimonial Quote',
      selector: '.animated-testimonial',
      style: null,
      blocks: ['quote-testimonial'],
      defaultContent: []
    },
    {
      id: 'section-5',
      name: 'Culture Section',
      selector: '.kb-row-layout-id48671_0e626d-d7',
      style: 'dark',
      blocks: ['carousel-culture'],
      defaultContent: ['.kt-adv-heading48671_625277-f0']
    },
    {
      id: 'section-6',
      name: 'At-a-Glance Statistics',
      selector: '.kb-row-layout-id48671_2dfa34-9f',
      style: 'dark',
      blocks: ['columns-stats'],
      defaultContent: []
    },
    {
      id: 'section-8',
      name: 'Client Service',
      selector: '.kb-row-layout-id48671_1ec135-3a',
      style: 'dark',
      blocks: ['accordion-service'],
      defaultContent: ['.kt-adv-heading48671_7f2fa7-2c', '.client-service-image-overlay']
    },
    {
      id: 'section-9',
      name: 'Spotlight News',
      selector: '.kb-row-layout-id48671_9bd49a-fb',
      style: 'dark',
      blocks: ['cards-news'],
      defaultContent: ['.kt-adv-heading48671_e75904-08']
    }
  ]
};

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'cards-people': cardsPeopleParser,
  'search-bar': searchBarParser,
  'quote-testimonial': quoteTestimonialParser,
  'carousel-culture': carouselCultureParser,
  'columns-stats': columnsStatsParser,
  'accordion-service': accordionServiceParser,
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
      path: path || '/index',
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
