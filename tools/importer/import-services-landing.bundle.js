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

  // tools/importer/import-services-landing.js
  var import_services_landing_exports = {};
  __export(import_services_landing_exports, {
    default: () => import_services_landing_default
  });

  // tools/importer/parsers/tabs-services.js
  function parse(element, { document }) {
    const tabTitles = element.querySelectorAll(".kt-tabs-title-list .kt-title-text");
    const tabPanels = element.querySelectorAll(".kt-tabs-content-wrap > .services-tab");
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
        const columns = panel.querySelectorAll(".kt-inside-inner-col");
        columns.forEach((col) => {
          const accordionPanes = col.querySelectorAll(".kt-accordion-pane");
          const buttonLinks = col.querySelectorAll(":scope > .wp-block-kadence-advancedbtn");
          buttonLinks.forEach((btnWrap) => {
            const link = btnWrap.querySelector("a");
            if (link) {
              const p = document.createElement("p");
              const a = document.createElement("a");
              a.href = link.href;
              const btnText = link.querySelector(".kt-btn-inner-text");
              a.textContent = btnText ? btnText.textContent.trim() : link.textContent.trim();
              p.appendChild(a);
              contentFrag.appendChild(p);
            }
          });
          accordionPanes.forEach((pane) => {
            const accordionTitle = pane.querySelector(".kt-blocks-accordion-title");
            if (accordionTitle) {
              const h3 = document.createElement("h3");
              h3.textContent = accordionTitle.textContent.trim();
              contentFrag.appendChild(h3);
            }
            const linkList = pane.querySelector(".kt-accordion-panel-inner ul");
            if (linkList) {
              const clonedList = linkList.cloneNode(true);
              contentFrag.appendChild(clonedList);
            }
          });
        });
      }
      cells.push([titleFrag, contentFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "tabs-services",
      cells
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

  // tools/importer/import-services-landing.js
  var PAGE_TEMPLATE = {
    name: "services-landing",
    description: "Services landing page with tabbed navigation for practices, industries, and A-Z listing",
    urls: [
      "https://www.mcguirewoods.com/services/"
    ],
    blocks: [
      {
        name: "tabs-services",
        instances: [".services-tabs"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Services Content",
        selector: [
          ".kb-row-layout-id48672_3b3bec-d5",
          ".kb-row-layout-id48672_2d17b9-98"
        ],
        style: null,
        blocks: ["tabs-services"],
        defaultContent: [".kb-row-layout-id48672_3b3bec-d5 h1"]
      }
    ]
  };
  var parsers = {
    "tabs-services": parse
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
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
  var import_services_landing_default = {
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
        path: path || "/services/index",
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_services_landing_exports);
})();
