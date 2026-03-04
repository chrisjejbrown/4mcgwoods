var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-practice-page.js
  var import_practice_page_exports = {};
  __export(import_practice_page_exports, {
    default: () => import_practice_page_default
  });

  // tools/importer/parsers/hero-practice.js
  function parse(element, { document }) {
    const imgEl = element.querySelector('.hide-on-print img, img[src*="images/"]');
    let bgImageUrl = "";
    if (!imgEl) {
      const bgCandidates = element.querySelectorAll('.kt-inside-inner-col, [style*="background"]');
      for (const candidate of bgCandidates) {
        const style = candidate.getAttribute("style") || "";
        const match = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/);
        if (match) {
          bgImageUrl = match[1];
          break;
        }
        const bgMatch = style.match(/background:\s*[^;]*url\(["']?([^"')]+)["']?\)/);
        if (bgMatch) {
          bgImageUrl = bgMatch[1];
          break;
        }
      }
    }
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(" field:image "));
    if (imgEl) {
      const img = document.createElement("img");
      img.src = imgEl.getAttribute("src") || "";
      img.alt = imgEl.getAttribute("alt") || "";
      imageCell.appendChild(img);
    } else if (bgImageUrl) {
      const img = document.createElement("img");
      img.src = bgImageUrl;
      img.alt = "";
      imageCell.appendChild(img);
    }
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(" field:text "));
    const h1 = element.querySelector("h1");
    if (h1) {
      const heading = document.createElement("h1");
      heading.textContent = h1.textContent.trim();
      textCell.appendChild(heading);
    }
    const descEl = element.querySelector('p[class*="wp-block-kadence-advancedheading"]');
    if (descEl) {
      const p = document.createElement("p");
      p.textContent = descEl.textContent.trim();
      textCell.appendChild(p);
    }
    const ctaLink = element.querySelector(".wp-block-kadence-advancedbtn a");
    if (ctaLink) {
      const href = ctaLink.getAttribute("href") || "#";
      if (href !== "#") {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = href;
        const btnText = ctaLink.querySelector(".kt-btn-inner-text");
        a.textContent = btnText ? btnText.textContent.trim() : ctaLink.textContent.trim();
        p.appendChild(a);
        textCell.appendChild(p);
      }
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Hero Practice",
      cells: [[imageCell], [textCell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-testimonial.js
  function parse2(element, { document }) {
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

  // tools/importer/parsers/cards-people.js
  function parse3(element, { document }) {
    const rows = [];
    const homepageSlides = element.querySelectorAll(".splide__slide:not(.splide__slide--clone)");
    const practiceCards = element.querySelectorAll("article.c-card-people");
    if (homepageSlides.length > 0) {
      homepageSlides.forEach((slide) => {
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
    } else if (practiceCards.length > 0) {
      practiceCards.forEach((card) => {
        const img = card.querySelector(".c-card-people__profile-img img");
        const imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:image "));
        if (img) {
          const picture = document.createElement("img");
          picture.src = img.getAttribute("src") || "";
          picture.alt = img.getAttribute("alt") || "";
          imageCell.appendChild(picture);
        }
        const textCell = document.createDocumentFragment();
        const nameEl = card.querySelector("h3.c-card__title");
        if (nameEl) {
          const h = document.createElement("h3");
          h.textContent = nameEl.textContent.trim();
          textCell.appendChild(h);
        }
        const roleEl = card.querySelector(".c-card-people__role");
        if (roleEl) {
          const p = document.createElement("p");
          p.textContent = roleEl.textContent.trim();
          textCell.appendChild(p);
        }
        const link = card.querySelector("h3.c-card__title a[href]");
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
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Cards People",
      cells: rows
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-related.js
  function parse4(element, { document }) {
    const tabTitles = element.querySelectorAll(".kt-tabs-title-list .kt-title-text");
    const tabPanels = element.querySelectorAll(".kt-tabs-content-wrap > .wp-block-kadence-tab");
    const cells = [];
    tabTitles.forEach((titleEl, index) => {
      const tabLabel = titleEl.textContent.trim();
      const panel = tabPanels[index];
      const titleFrag = document.createDocumentFragment();
      titleFrag.appendChild(document.createComment(" field:title "));
      const titleText = document.createTextNode(tabLabel);
      titleFrag.appendChild(titleText);
      const contentFrag = document.createDocumentFragment();
      contentFrag.appendChild(document.createComment(" field:content_richtext "));
      if (panel) {
        const serviceCards = panel.querySelectorAll(".c-card-service");
        const ul = document.createElement("ul");
        serviceCards.forEach((card) => {
          const link = card.querySelector("a");
          const heading = card.querySelector(".c-card-service__heading");
          if (link && heading) {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = link.getAttribute("href") || "";
            a.textContent = heading.textContent.trim();
            li.appendChild(a);
            ul.appendChild(li);
          }
        });
        if (ul.children.length > 0) {
          contentFrag.appendChild(ul);
        }
      }
      cells.push([titleFrag, contentFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Tabs Related",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news.js
  function parse5(element, { document }) {
    const rows = [];
    const homepageItems = element.querySelectorAll(".splide__slide:not(.splide__slide--clone) .kt-blocks-post-grid-item");
    const practiceArticles = element.querySelectorAll("article.c-card-media");
    if (homepageItems.length > 0) {
      homepageItems.forEach((item) => {
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
    } else if (practiceArticles.length > 0) {
      practiceArticles.forEach((article) => {
        const imageCell = document.createDocumentFragment();
        const textCell = document.createDocumentFragment();
        const categoryEl = article.querySelector(".c-card__type");
        if (categoryEl) {
          const catP = document.createElement("p");
          catP.textContent = categoryEl.textContent.trim();
          textCell.appendChild(catP);
        }
        const titleEl = article.querySelector("h3.c-card__title");
        const link = article.querySelector("a.c-card__link");
        if (titleEl) {
          const h3 = document.createElement("h3");
          if (link && link.getAttribute("href")) {
            const a = document.createElement("a");
            a.href = link.getAttribute("href");
            a.textContent = titleEl.textContent.trim();
            h3.appendChild(a);
          } else {
            h3.textContent = titleEl.textContent.trim();
          }
          textCell.appendChild(h3);
        }
        const dateEl = article.querySelector(".c-card__date");
        if (dateEl) {
          const dateP = document.createElement("p");
          dateP.textContent = dateEl.textContent.trim();
          textCell.appendChild(dateP);
        }
        rows.push([imageCell, textCell]);
      });
    }
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

  // tools/importer/import-practice-page.js
  var PAGE_TEMPLATE = {
    name: "practice-page",
    description: "Practice area detail page with overview, sub-practices, related professionals, and experience highlights",
    urls: [
      "https://www.mcguirewoods.com/services/practices/business-litigation",
      "https://www.mcguirewoods.com/services/practices/intellectual-property",
      "https://www.mcguirewoods.com/services/practices/data-privacy-cybersecurity"
    ],
    blocks: [
      {
        name: "hero-practice",
        instances: [".service-hero-section"]
      },
      {
        name: "quote-testimonial",
        instances: [".animated-testimonial"]
      },
      {
        name: "cards-people",
        instances: [".wp-block-mgw-people-content-selector"]
      },
      {
        name: "tabs-related",
        instances: [".service-related-tabs"]
      },
      {
        name: "cards-news",
        instances: [".c-related-posts"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero Banner",
        selector: ".service-hero-section",
        style: null,
        blocks: ["hero-practice"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Read More Content",
        selector: ".read-more-content",
        style: null,
        blocks: [],
        defaultContent: [".read-more-content"]
      },
      {
        id: "section-3",
        name: "Practice Tagline",
        selector: [".kb-row-layout-id137_9f4a50-53", ".entry-content > .kb-row-layout-wrap.kt-row-has-bg:nth-of-type(3)"],
        style: null,
        blocks: [],
        defaultContent: [".kb-row-layout-id137_9f4a50-53 p"]
      },
      {
        id: "section-4",
        name: "Testimonial Slider",
        selector: ".animated-testimonial",
        style: null,
        blocks: ["quote-testimonial"],
        defaultContent: []
      },
      {
        id: "section-5",
        name: "Team Leaders",
        selector: [".kb-row-layout-id137_e8b3a0-fa", ".entry-content > .kb-row-layout-wrap:has(.wp-block-mgw-people-content-selector)"],
        style: null,
        blocks: ["cards-people"],
        defaultContent: [".kb-row-layout-id137_e8b3a0-fa h2"]
      },
      {
        id: "section-6",
        name: "Related Practices and Industries",
        selector: [".kb-row-layout-id137_bff9ff-d3", ".entry-content > .kb-row-layout-wrap:has(.service-related-tabs)"],
        style: "light",
        blocks: ["tabs-related"],
        defaultContent: []
      },
      {
        id: "section-7",
        name: "News",
        selector: ".entry-content > .c-related-posts:nth-of-type(1)",
        style: "dark",
        blocks: ["cards-news"],
        defaultContent: []
      },
      {
        id: "section-8",
        name: "Insights",
        selector: ".entry-content > .c-related-posts:nth-of-type(2)",
        style: "dark",
        blocks: ["cards-news"],
        defaultContent: []
      },
      {
        id: "section-9",
        name: "Events",
        selector: ".entry-content > .c-related-posts:nth-of-type(3)",
        style: "dark",
        blocks: ["cards-news"],
        defaultContent: []
      }
    ]
  };
  var parsers = {
    "hero-practice": parse,
    "quote-testimonial": parse2,
    "cards-people": parse3,
    "tabs-related": parse4,
    "cards-news": parse5
  };
  var transformers = [
    transform,
    transform2
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = {
      ...payload,
      template: PAGE_TEMPLATE
    };
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
  var import_practice_page_default = {
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
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_practice_page_exports);
})();
