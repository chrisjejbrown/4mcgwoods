var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document }) {
    const slides = element.querySelectorAll(".splide__slide:not(.splide__slide--clone)");
    const rows = [];
    slides.forEach((slide) => {
      const heading = slide.querySelector("h1");
      const ctaLink = slide.querySelector(".kb-button");
      const video = slide.querySelector("video.kb-blocks-bg-video");
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:media_image "));
      if (video && video.getAttribute("src")) {
        const videoLink = document.createElement("a");
        videoLink.href = video.getAttribute("src");
        videoLink.textContent = video.getAttribute("src");
        imageCell.appendChild(videoLink);
      }
      const textCell = document.createDocumentFragment();
      if (heading) {
        const h = document.createElement("h1");
        h.textContent = heading.textContent.trim();
        textCell.appendChild(h);
      }
      if (ctaLink) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = ctaLink.getAttribute("href") || "";
        const btnText = ctaLink.querySelector(".kt-btn-inner-text");
        a.textContent = btnText ? btnText.textContent.trim() : ctaLink.textContent.trim();
        p.appendChild(a);
        textCell.appendChild(p);
      }
      rows.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Carousel Hero",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-people.js
  function parse2(element, { document }) {
    const slides = element.querySelectorAll(".splide__slide:not(.splide__slide--clone)");
    const rows = [];
    slides.forEach((slide) => {
      const cards = slide.querySelectorAll(".team-member-card");
      cards.forEach((card) => {
        const img = card.querySelector("img");
        const imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:image "));
        if (img) {
          const picture = document.createElement("img");
          picture.src = img.getAttribute("src") || "";
          picture.alt = img.getAttribute("alt") || "";
          imageCell.appendChild(picture);
        }
        const textCell = document.createDocumentFragment();
        const nameEl = card.querySelector(".team-member-card-name, h3, h4");
        if (nameEl) {
          const h = document.createElement("h3");
          h.textContent = nameEl.textContent.trim();
          textCell.appendChild(h);
        }
        const titleEl = card.querySelector(".team-member-card-title, .team-member-card-position");
        if (titleEl) {
          const p = document.createElement("p");
          p.textContent = titleEl.textContent.trim();
          textCell.appendChild(p);
        }
        const link = card.querySelector("a[href]");
        if (link && link.getAttribute("href")) {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = link.getAttribute("href");
          a.textContent = nameEl ? nameEl.textContent.trim() : "View Profile";
          p.appendChild(a);
          textCell.appendChild(p);
        }
        rows.push([imageCell, textCell]);
      });
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Cards People",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/search-bar.js
  function parse3(element, { document }) {
    const indexCell = document.createDocumentFragment();
    indexCell.appendChild(document.createComment(" field:index "));
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = "/query-index.json";
    a.textContent = "/query-index.json";
    p.appendChild(a);
    indexCell.appendChild(p);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Search Bar",
      cells: [[indexCell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-testimonial.js
  function parse4(element, { document }) {
    const quoteEl = element.querySelector("strong");
    const quoteText = quoteEl ? quoteEl.textContent.trim() : "";
    const paragraphs = element.querySelectorAll('p[class*="wp-block-kadence-advancedheading"]');
    let attribution = "";
    if (paragraphs.length >= 2) {
      attribution = paragraphs[paragraphs.length - 1].textContent.trim();
    }
    const quotationCell = document.createDocumentFragment();
    quotationCell.appendChild(document.createComment(" field:quotation "));
    const blockquote = document.createElement("blockquote");
    blockquote.textContent = quoteText;
    quotationCell.appendChild(blockquote);
    const attributionCell = document.createDocumentFragment();
    attributionCell.appendChild(document.createComment(" field:attribution "));
    const attrP = document.createElement("p");
    attrP.textContent = attribution;
    attributionCell.appendChild(attrP);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Quote Testimonial",
      cells: [[quotationCell], [attributionCell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-culture.js
  function parse5(element, { document }) {
    const slides = element.querySelectorAll(".splide__slide:not(.splide__slide--clone)");
    const rows = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".kt-inside-inner-col img");
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:media_image "));
      if (img) {
        const picture = document.createElement("img");
        picture.src = img.getAttribute("src") || "";
        picture.alt = img.getAttribute("alt") || "";
        imageCell.appendChild(picture);
      }
      const textCell = document.createDocumentFragment();
      const titleEl = slide.querySelector("h3");
      if (titleEl) {
        const h = document.createElement("h3");
        h.textContent = titleEl.textContent.trim();
        textCell.appendChild(h);
      }
      const descEl = slide.querySelector('p[class*="wp-block-kadence-advancedheading"]');
      if (descEl) {
        const p = document.createElement("p");
        p.textContent = descEl.textContent.trim();
        textCell.appendChild(p);
      }
      const ctaLink = slide.querySelector(".kb-button");
      if (ctaLink) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = ctaLink.getAttribute("href") || "";
        const btnText = ctaLink.querySelector(".kt-btn-inner-text");
        a.textContent = btnText ? btnText.textContent.trim() : ctaLink.textContent.trim();
        p.appendChild(a);
        textCell.appendChild(p);
      }
      rows.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Carousel Culture",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-stats.js
  function parse6(element, { document }) {
    const heading = element.querySelector("h2");
    const leftCell = document.createDocumentFragment();
    if (heading) {
      const h2 = document.createElement("h2");
      h2.innerHTML = heading.innerHTML;
      leftCell.appendChild(h2);
    }
    const rightCell = document.createDocumentFragment();
    const counters = element.querySelectorAll(".kb-count-up");
    counters.forEach((counter) => {
      const srText = counter.querySelector(".screen-reader-text");
      const numberEl = srText || counter.querySelector(".kb-count-up-number");
      const titleEl = counter.querySelector(".kb-count-up-title");
      if (numberEl && titleEl) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = numberEl.textContent.trim();
        p.appendChild(strong);
        p.appendChild(document.createTextNode(" " + titleEl.textContent.trim()));
        rightCell.appendChild(p);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Columns Stats",
      cells: [[leftCell, rightCell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-service.js
  function parse7(element, { document }) {
    const panes = element.querySelectorAll(".wp-block-kadence-pane");
    const rows = [];
    panes.forEach((pane) => {
      const titleEl = pane.querySelector(".kt-blocks-accordion-title");
      const summaryCell = document.createDocumentFragment();
      summaryCell.appendChild(document.createComment(" field:summary "));
      const titleP = document.createElement("p");
      titleP.textContent = titleEl ? titleEl.textContent.trim() : "";
      summaryCell.appendChild(titleP);
      const textCell = document.createDocumentFragment();
      const panelInner = pane.querySelector(".kt-accordion-panel-inner");
      if (panelInner) {
        const paragraphs = panelInner.querySelectorAll("p");
        paragraphs.forEach((p) => {
          const newP = document.createElement("p");
          newP.innerHTML = p.innerHTML;
          textCell.appendChild(newP);
        });
      }
      rows.push([summaryCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Accordion Service",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news.js
  function parse8(element, { document }) {
    const items = element.querySelectorAll(".splide__slide:not(.splide__slide--clone) .kt-blocks-post-grid-item");
    const rows = [];
    items.forEach((item) => {
      const imageCell = document.createDocumentFragment();
      const textCell = document.createDocumentFragment();
      const categoryEl = item.querySelector(".kt-blocks-above-categories a");
      if (categoryEl) {
        const catP = document.createElement("p");
        catP.textContent = categoryEl.textContent.trim();
        textCell.appendChild(catP);
      }
      const titleLink = item.querySelector(".entry-title a");
      if (titleLink) {
        const h3 = document.createElement("h3");
        const a = document.createElement("a");
        a.href = titleLink.getAttribute("href") || "";
        a.textContent = titleLink.textContent.trim();
        h3.appendChild(a);
        textCell.appendChild(h3);
      }
      const dateEl = item.querySelector(".kt-blocks-post-date");
      if (dateEl) {
        const dateP = document.createElement("p");
        dateP.textContent = dateEl.textContent.trim();
        textCell.appendChild(dateP);
      }
      rows.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Cards News",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/mcguirewoods-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".kb-v-lg-hidden.kb-v-md-hidden.kb-v-sm-hidden"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".splide__slide--clone"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".splide__arrows"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#masthead",
        "#colophon",
        ".skip-link",
        ".screen-reader-text",
        "noscript",
        "link",
        "iframe"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-track");
        el.removeAttribute("onclick");
        el.removeAttribute("data-splide");
      });
    }
  }

  // tools/importer/transformers/mcguirewoods-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document: element.getRootNode() };
      const template = payload && payload.template;
      if (!template || !template.sections || template.sections.length < 2) return;
      const sections = [...template.sections].reverse();
      for (const section of sections) {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectors) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) continue;
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(sectionMetadata);
        }
        if (section.id !== template.sections[0].id) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Main homepage with hero slider, featured people, search, testimonials, culture, statistics, client service, and news",
    urls: [
      "https://www.mcguirewoods.com"
    ],
    blocks: [
      {
        name: "carousel-hero",
        instances: [".home-hero-slider"]
      },
      {
        name: "cards-people",
        instances: [".home-team-members-slider"]
      },
      {
        name: "search-bar",
        instances: [".home-search-form"]
      },
      {
        name: "quote-testimonial",
        instances: [".animated-testimonial"]
      },
      {
        name: "carousel-culture",
        instances: [".home-culture-carousel"]
      },
      {
        name: "columns-stats",
        instances: [".kb-row-layout-id48671_2dfa34-9f"]
      },
      {
        name: "accordion-service",
        instances: [".kt-accordion-id48671_e48fd9-64"]
      },
      {
        name: "cards-news",
        instances: [".home-news-carousel"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero Slider",
        selector: ".home-hero-slider-row",
        style: null,
        blocks: ["carousel-hero"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Featured People",
        selector: ".kb-row-layout-id48671_aaf30d-32",
        style: null,
        blocks: ["cards-people"],
        defaultContent: [".home-people-title"]
      },
      {
        id: "section-3",
        name: "Search Bar",
        selector: ".kb-row-layout-id48671_a87e1e-e2",
        style: "dark",
        blocks: ["search-bar"],
        defaultContent: []
      },
      {
        id: "section-4",
        name: "Testimonial Quote",
        selector: ".animated-testimonial",
        style: null,
        blocks: ["quote-testimonial"],
        defaultContent: []
      },
      {
        id: "section-5",
        name: "Culture Section",
        selector: ".kb-row-layout-id48671_0e626d-d7",
        style: "dark",
        blocks: ["carousel-culture"],
        defaultContent: [".kt-adv-heading48671_625277-f0"]
      },
      {
        id: "section-6",
        name: "At-a-Glance Statistics",
        selector: ".kb-row-layout-id48671_2dfa34-9f",
        style: "dark",
        blocks: ["columns-stats"],
        defaultContent: []
      },
      {
        id: "section-8",
        name: "Client Service",
        selector: ".kb-row-layout-id48671_1ec135-3a",
        style: "dark",
        blocks: ["accordion-service"],
        defaultContent: [".kt-adv-heading48671_7f2fa7-2c", ".client-service-image-overlay"]
      },
      {
        id: "section-9",
        name: "Spotlight News",
        selector: ".kb-row-layout-id48671_9bd49a-fb",
        style: "dark",
        blocks: ["cards-news"],
        defaultContent: [".kt-adv-heading48671_e75904-08"]
      }
    ]
  };
  var parsers = {
    "carousel-hero": parse,
    "cards-people": parse2,
    "search-bar": parse3,
    "quote-testimonial": parse4,
    "carousel-culture": parse5,
    "columns-stats": parse6,
    "accordion-service": parse7,
    "cards-news": parse8
  };
  var transformers = [
    transform,
    transform2
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path: path || "/index",
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
